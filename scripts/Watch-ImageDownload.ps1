param([switch]$Notify, [int]$PollSeconds = 15)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$jobDirectory = Join-Path $projectRoot 'GeneaTree/test-artifacts/image-review'
$statusFile = Join-Path $jobDirectory 'download-status.json'
$signalFile = Join-Path $jobDirectory 'download-finished.json'
while ($true) {
    try { $state = Get-Content -LiteralPath $statusFile -Raw | ConvertFrom-Json }
    catch { Start-Sleep -Seconds $PollSeconds; continue }
    $terminal = $state.status -in @('complete', 'needs-review', 'failed', 'interrupted')
    if (-not $terminal -and -not (Get-Process -Id $state.pid -ErrorAction SilentlyContinue)) {
        $state.status = 'interrupted'
        $terminal = $true
    }
    if ($terminal) {
        $state | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $signalFile -Encoding UTF8
        $message = "Images: $($state.status). Fichiers locaux: $($state.copiedFiles). Voir download-finished.json."
        Write-Output $message
        if ($Notify) {
            try {
                Add-Type -AssemblyName System.Windows.Forms
                Add-Type -AssemblyName System.Drawing
                $notification = New-Object System.Windows.Forms.NotifyIcon
                $notification.Icon = [System.Drawing.SystemIcons]::Information
                $notification.Visible = $true
                $notification.ShowBalloonTip(15000, 'GeneaTree - téléchargement terminé', $message, [System.Windows.Forms.ToolTipIcon]::Info)
                Start-Sleep -Seconds 20
                $notification.Dispose()
            } catch { Write-Warning $_ }
        }
        break
    }
    Write-Output "$(Get-Date -Format s) $($state.status) - $($state.copiedFiles) fichiers - reprise: $($state.nextRetryAt)"
    Start-Sleep -Seconds $PollSeconds
}
