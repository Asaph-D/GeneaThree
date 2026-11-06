param([ValidateRange(1, 500)][int]$MaxAttempts = 60)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$jobDirectory = Join-Path $projectRoot 'GeneaTree/test-artifacts/image-review'
New-Item -ItemType Directory -Path $jobDirectory -Force | Out-Null
$statusFile = Join-Path $jobDirectory 'download-status.json'
if (Test-Path -LiteralPath $statusFile) {
    $previous = Get-Content -LiteralPath $statusFile -Raw | ConvertFrom-Json
    if ($previous.status -in @('running', 'waiting') -and (Get-Process -Id $previous.pid -ErrorAction SilentlyContinue)) {
        throw "Un téléchargement est déjà actif (PID $($previous.pid))."
    }
}
foreach ($name in @('download.stop', 'download-finished.json')) {
    $item = Join-Path $jobDirectory $name
    if (Test-Path -LiteralPath $item) { Remove-Item -LiteralPath $item }
}
$env:IMAGE_MAX_ATTEMPTS = "$MaxAttempts"
$nodePath = (Get-Command node.exe).Source
$worker = Start-Process -FilePath $nodePath -ArgumentList @('scripts/archive-discovery-images.mjs') -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $jobDirectory 'download-output.log') -RedirectStandardError (Join-Path $jobDirectory 'download-error.log') -PassThru
$watchScript = Join-Path $PSScriptRoot 'Watch-ImageDownload.ps1'
for ($index = 0; $index -lt 50; $index++) {
    try {
        $current = Get-Content -LiteralPath $statusFile -Raw | ConvertFrom-Json
        if ($current.pid -eq $worker.Id) { break }
    } catch {}
    if ($worker.HasExited) { throw 'Le téléchargement a échoué au démarrage; consulter download-error.log.' }
    Start-Sleep -Milliseconds 100
}
$watcher = Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$watchScript`"", '-Notify') -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $jobDirectory 'watcher-output.log') -RedirectStandardError (Join-Path $jobDirectory 'watcher-error.log') -PassThru
@{ workerPid = $worker.Id; watcherPid = $watcher.Id; startedAt = (Get-Date).ToString('o') } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $jobDirectory 'background-processes.json')
Write-Output "Téléchargement PID $($worker.Id); watcher PID $($watcher.Id); état: $statusFile"
