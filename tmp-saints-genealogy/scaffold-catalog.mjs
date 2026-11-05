import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1'));
const catalogueRoot = path.join(root, 'catalogue');

const categories = [
  { id: 'figures-majeures-fondatrices', label: 'Figures majeures et fondatrices', description: 'Figures centrales des Évangiles, des Actes et des premières communautés chrétiennes.' },
  { id: 'intercession-devotion-populaire', label: 'Intercession et dévotion populaire', description: 'Saints particulièrement invoqués dans la piété populaire et les situations difficiles.' },
  { id: 'mystiques-figures-spirituelles', label: 'Mystiques et figures spirituelles', description: 'Fondateurs, contemplatifs, réformateurs et docteurs ayant marqué la spiritualité chrétienne.' },
  { id: 'saints-patrons-culture', label: 'Saints patrons et culture générale', description: 'Figures connues pour leurs patronages, traditions, symboles et héritages culturels.' },
  { id: 'epoque-moderne-contemporaine', label: 'Époque moderne et contemporaine', description: 'Témoins, martyrs et figures canonisées des périodes moderne et contemporaine.' },
  { id: 'saints-royaux-historiques', label: 'Saints royaux et figures historiques', description: 'Souverains et membres de dynasties dont les parentés historiques permettent des arbres étendus.' },
  { id: 'apotres-evangelistes', label: 'Apôtres et évangélistes', description: 'Disciples, témoins apostoliques et auteurs traditionnellement associés aux écrits du Nouveau Testament.' },
  { id: 'peres-docteurs-eglise', label: 'Pères et docteurs de l’Église', description: 'Théologiens, prédicateurs et auteurs majeurs de la tradition chrétienne.' },
  { id: 'martyrs-premiers-siecles', label: 'Martyrs et premiers siècles', description: 'Témoins des premières communautés chrétiennes et des périodes de persécution.' },
  { id: 'saintes-femmes', label: 'Saintes femmes et grandes témoins', description: 'Femmes ayant marqué la vie spirituelle, familiale, intellectuelle ou sociale.' },
  { id: 'missionnaires-evangelisateurs', label: 'Missionnaires et évangélisateurs', description: 'Figures associées à la transmission de la foi entre peuples, langues et continents.' },
  { id: 'afrique-diaspora', label: 'Saints d’Afrique et de la diaspora', description: 'Saints nés, établis ou engagés dans les Églises et sociétés africaines.' },
  { id: 'jeunesse-education', label: 'Jeunesse et éducation', description: 'Éducateurs, fondateurs d’écoles et modèles particulièrement associés aux jeunes.' },
  { id: 'charite-justice-sociale', label: 'Charité et justice sociale', description: 'Figures engagées auprès des pauvres, des malades, des exclus et pour la dignité humaine.' },
  { id: 'ermites-monachisme', label: 'Ermites et monachisme', description: 'Pères et mères du désert, fondateurs et réformateurs de communautés monastiques.' },
];

const saints = [
  ['figures-majeures-fondatrices', 'vierge-marie', 'La Vierge Marie', 'Reine des Saints et mère de Jésus, au cœur de nombreuses dévotions mariales.', ['Marie', 'Notre-Dame', 'Lourdes', 'Fatima', 'Médaille miraculeuse']],
  ['figures-majeures-fondatrices', 'saint-joseph', 'Saint Joseph', 'Époux de Marie et père nourricier de Jésus, patron de la Sainte Famille et des travailleurs.', ['Joseph', 'Sainte Famille', 'travailleurs']],
  ['figures-majeures-fondatrices', 'saint-pierre', 'Saint Pierre', 'Apôtre de Jésus et figure de premier plan de l’Église primitive.', ['Simon Pierre', 'Céphas', 'apôtre', 'pape']],
  ['figures-majeures-fondatrices', 'saint-paul', 'Saint Paul', 'Apôtre des nations et auteur de plusieurs épîtres du Nouveau Testament.', ['Saul de Tarse', 'Paul de Tarse', 'épîtres', 'apôtre']],
  ['figures-majeures-fondatrices', 'saint-jean-baptiste', 'Saint Jean-Baptiste', 'Précurseur de Jésus et prédicateur du baptême de conversion.', ['Jean le Baptiste', 'précurseur']],
  ['intercession-devotion-populaire', 'saint-antoine-de-padoue', 'Saint Antoine de Padoue', 'Franciscain et docteur de l’Église, populaire pour les objets perdus et les situations difficiles.', ['Antoine', 'objets perdus', 'franciscain']],
  ['intercession-devotion-populaire', 'saint-jude', 'Saint Jude', 'Apôtre traditionnellement invoqué pour les causes difficiles ou désespérées.', ['Jude Thaddée', 'causes perdues', 'apôtre']],
  ['intercession-devotion-populaire', 'sainte-rita-de-cascia', 'Sainte Rita de Cascia', 'Religieuse italienne associée aux causes impossibles et aux épreuves familiales.', ['Rita', 'causes impossibles', 'couple']],
  ['intercession-devotion-populaire', 'saint-expedit', 'Saint Expédit', 'Figure de dévotion populaire invoquée pour les demandes urgentes.', ['Expédit', 'urgence', 'demandes pressantes']],
  ['intercession-devotion-populaire', 'saint-padre-pio', 'Saint Padre Pio', 'Capucin italien du XXe siècle connu pour sa vie de prière et son ministère spirituel.', ['Padre Pio', 'Pie de Pietrelcina', 'capucin']],
  ['mystiques-figures-spirituelles', 'saint-francois-assise', 'Saint François d’Assise', 'Fondateur des Franciscains, associé à la pauvreté évangélique, à la paix et à la création.', ['François', 'Assise', 'animaux', 'nature', 'franciscain']],
  ['mystiques-figures-spirituelles', 'sainte-therese-lisieux', 'Sainte Thérèse de Lisieux', 'Carmélite française et docteur de l’Église, connue pour la spiritualité de la petite voie.', ['Petite Thérèse', 'Thérèse de l’Enfant-Jésus', 'carmélite']],
  ['mystiques-figures-spirituelles', 'sainte-therese-avila', 'Sainte Thérèse d’Avila', 'Mystique espagnole, réformatrice du Carmel et docteur de l’Église.', ['Thérèse de Jésus', 'Avila', 'Carmel']],
  ['mystiques-figures-spirituelles', 'saint-benoit-nursie', 'Saint Benoît de Nursie', 'Auteur de la Règle de saint Benoît, figure majeure du monachisme occidental.', ['Benoît', 'Nursie', 'monachisme', 'Europe']],
  ['saints-patrons-culture', 'saint-nicolas', 'Saint Nicolas', 'Évêque associé à la protection des enfants et à de nombreuses traditions populaires.', ['Nicolas de Myre', 'enfants', 'Père Noël']],
  ['saints-patrons-culture', 'saint-valentin', 'Saint Valentin', 'Nom associé dans la tradition populaire au patronage des amoureux.', ['Valentin', 'amoureux']],
  ['saints-patrons-culture', 'saint-christophe', 'Saint Christophe', 'Figure traditionnellement invoquée par les voyageurs et les conducteurs.', ['Christophe', 'voyageurs', 'conducteurs']],
  ['saints-patrons-culture', 'saint-georges', 'Saint Georges', 'Martyr associé à la légende du dragon et patron de plusieurs pays et mouvements.', ['Georges', 'dragon', 'scouts']],
  ['saints-patrons-culture', 'sainte-jeanne-arc', 'Sainte Jeanne d’Arc', 'Héroïne française, martyre et patronne secondaire de la France.', ['Jeanne d’Arc', 'France', 'Orléans']],
  ['epoque-moderne-contemporaine', 'sainte-mere-teresa', 'Sainte Mère Teresa de Calcutta', 'Fondatrice des Missionnaires de la Charité et figure du service des plus pauvres.', ['Mère Teresa', 'Calcutta', 'pauvres']],
  ['epoque-moderne-contemporaine', 'saint-jean-paul-ii', 'Saint Jean-Paul II', 'Pape du XXe siècle particulièrement associé aux jeunes, aux familles et aux voyages apostoliques.', ['Jean-Paul II', 'Karol Wojtyła', 'pape']],
  ['epoque-moderne-contemporaine', 'saint-maximilien-kolbe', 'Saint Maximilien Kolbe', 'Franciscain polonais mort à Auschwitz après avoir offert sa vie à la place d’un autre prisonnier.', ['Maximilien Kolbe', 'Auschwitz', 'martyr', 'franciscain']],
  ['epoque-moderne-contemporaine', 'saint-carlo-acutis', 'Saint Carlo Acutis', 'Jeune catholique italien associé à l’évangélisation numérique et à la documentation des miracles eucharistiques.', ['Carlo Acutis', 'Internet', 'numérique', 'Eucharistie']],
  ['saints-royaux-historiques', 'saint-louis-ix', 'Saint Louis IX', 'Roi de France du XIIIe siècle, fils de Louis VIII et de Blanche de Castille.', ['Louis IX', 'Saint Louis', 'roi de France']],
  ['saints-royaux-historiques', 'sainte-elisabeth-de-hongrie', 'Sainte Élisabeth de Hongrie', 'Princesse de Hongrie et landgravine de Thuringe, connue pour son service des pauvres.', ['Élisabeth de Thuringe', 'Elizabeth of Hungary']],
  ['saints-royaux-historiques', 'sainte-marguerite-ecosse', 'Sainte Marguerite d’Écosse', 'Reine d’Écosse du XIe siècle, fille d’Édouard l’Exilé et épouse de Malcolm III.', ['Margaret of Scotland', 'Marguerite reine d’Écosse']],
  ['apotres-evangelistes', 'saint-andre', 'Saint André', 'Apôtre, frère de Simon Pierre, présent dans les récits évangéliques.', ['André apôtre', 'frère de Pierre']],
  ['apotres-evangelistes', 'saint-jacques-majeur', 'Saint Jacques le Majeur', 'Apôtre, fils de Zébédée et frère de Jean.', ['Jacques de Zébédée', 'Jacques le Majeur']],
  ['apotres-evangelistes', 'saint-jean-evangeliste', 'Saint Jean l’Évangéliste', 'Apôtre et figure traditionnellement associée au quatrième Évangile.', ['Jean apôtre', 'disciple bien-aimé']],
  ['apotres-evangelistes', 'saint-matthieu', 'Saint Matthieu', 'Apôtre et figure traditionnellement associée à l’Évangile selon Matthieu.', ['Matthieu évangéliste', 'Lévi']],
  ['apotres-evangelistes', 'saint-marc', 'Saint Marc', 'Évangéliste associé à Pierre dans la tradition chrétienne ancienne.', ['Marc évangéliste', 'Jean Marc']],
  ['apotres-evangelistes', 'saint-luc', 'Saint Luc', 'Évangéliste traditionnellement associé à l’Évangile selon Luc et aux Actes.', ['Luc évangéliste', 'médecin']],
  ['apotres-evangelistes', 'sainte-marie-madeleine', 'Sainte Marie Madeleine', 'Disciple de Jésus et témoin de la Résurrection dans les récits évangéliques.', ['Marie de Magdala', 'apôtre des apôtres']],
  ['peres-docteurs-eglise', 'saint-augustin-hippone', 'Saint Augustin d’Hippone', 'Évêque d’Hippone, auteur des Confessions et figure majeure de la pensée chrétienne.', ['Augustin', 'Hippone', 'docteur de l’Église']],
  ['peres-docteurs-eglise', 'sainte-monique', 'Sainte Monique', 'Mère d’Augustin d’Hippone, connue à travers le récit des Confessions.', ['Monique', 'mère de saint Augustin']],
  ['peres-docteurs-eglise', 'saint-ambroise', 'Saint Ambroise de Milan', 'Évêque, prédicateur et docteur de l’Église du IVe siècle.', ['Ambroise', 'Milan']],
  ['peres-docteurs-eglise', 'saint-jerome', 'Saint Jérôme', 'Bibliste et docteur de l’Église associé à la traduction latine de la Bible.', ['Jérôme de Stridon', 'Vulgate']],
  ['peres-docteurs-eglise', 'saint-gregoire-grand', 'Saint Grégoire le Grand', 'Pape, auteur spirituel et docteur de l’Église.', ['Grégoire Ier', 'pape']],
  ['peres-docteurs-eglise', 'saint-thomas-aquin', 'Saint Thomas d’Aquin', 'Dominicain, théologien et docteur de l’Église.', ['Thomas d’Aquin', 'docteur angélique']],
  ['peres-docteurs-eglise', 'sainte-catherine-sienne', 'Sainte Catherine de Sienne', 'Mystique dominicaine, conseillère spirituelle et docteur de l’Église.', ['Catherine de Sienne', 'dominicaine']],
  ['martyrs-premiers-siecles', 'saint-etienne', 'Saint Étienne', 'Figure présentée dans les Actes des Apôtres comme premier martyr chrétien.', ['Étienne protomartyr', 'Actes des Apôtres']],
  ['martyrs-premiers-siecles', 'sainte-perpetue', 'Sainte Perpétue', 'Martyre de Carthage dont la Passion conserve un témoignage ancien.', ['Perpétue de Carthage', 'martyre']],
  ['martyrs-premiers-siecles', 'sainte-felicite', 'Sainte Félicité', 'Martyre de Carthage commémorée avec Perpétue.', ['Félicité de Carthage', 'martyre']],
  ['martyrs-premiers-siecles', 'sainte-agnes', 'Sainte Agnès de Rome', 'Jeune martyre romaine honorée depuis l’Antiquité chrétienne.', ['Agnès', 'Rome', 'martyre']],
  ['martyrs-premiers-siecles', 'sainte-lucie', 'Sainte Lucie de Syracuse', 'Martyre sicilienne associée dans la tradition à la lumière et à la vue.', ['Lucie', 'Syracuse']],
  ['martyrs-premiers-siecles', 'saint-laurent', 'Saint Laurent de Rome', 'Diacre et martyr romain du IIIe siècle.', ['Laurent', 'diacre', 'Rome']],
  ['saintes-femmes', 'sainte-anne', 'Sainte Anne', 'Mère de Marie selon la tradition chrétienne ancienne.', ['Anne', 'mère de Marie', 'grand-mère de Jésus']],
  ['saintes-femmes', 'sainte-claire-assise', 'Sainte Claire d’Assise', 'Fondatrice des Clarisses et proche de François d’Assise.', ['Claire', 'Assise', 'Clarisses']],
  ['saintes-femmes', 'sainte-hildegarde-bingen', 'Sainte Hildegarde de Bingen', 'Abbesse, compositrice, naturaliste et docteur de l’Église.', ['Hildegarde', 'Bingen']],
  ['saintes-femmes', 'sainte-brigitte-suede', 'Sainte Brigitte de Suède', 'Mystique, fondatrice et copatronne de l’Europe.', ['Brigitte de Suède', 'Brigittines']],
  ['saintes-femmes', 'sainte-josephine-bakhita', 'Sainte Joséphine Bakhita', 'Religieuse soudanaise devenue symbole de liberté, de pardon et de dignité.', ['Bakhita', 'Soudan', 'Canossienne']],
  ['missionnaires-evangelisateurs', 'saint-patrice', 'Saint Patrick', 'Missionnaire et évêque traditionnellement associé à l’évangélisation de l’Irlande.', ['Patrick', 'Irlande']],
  ['missionnaires-evangelisateurs', 'saint-boniface', 'Saint Boniface', 'Missionnaire et évêque associé à l’organisation de l’Église en Germanie.', ['Boniface de Mayence', 'Germanie']],
  ['missionnaires-evangelisateurs', 'saint-francois-xavier', 'Saint François Xavier', 'Jésuite missionnaire actif en Asie au XVIe siècle.', ['François Xavier', 'jésuite', 'Inde', 'Japon']],
  ['missionnaires-evangelisateurs', 'saints-cyrille-methode', 'Saints Cyrille et Méthode', 'Frères missionnaires associés à l’évangélisation slave et à la traduction liturgique.', ['Cyrille', 'Méthode', 'apôtres des Slaves']],
  ['missionnaires-evangelisateurs', 'sainte-therese-benedicte-croix', 'Sainte Thérèse-Bénédicte de la Croix', 'Philosophe carmélite, née Edith Stein, morte à Auschwitz.', ['Edith Stein', 'carmélite', 'Auschwitz']],
  ['afrique-diaspora', 'saint-cyprien-carthage', 'Saint Cyprien de Carthage', 'Évêque de Carthage, auteur chrétien ancien et martyr.', ['Cyprien', 'Carthage', 'Tunisie']],
  ['afrique-diaspora', 'saint-charles-lwanga', 'Saint Charles Lwanga', 'Martyr ougandais du XIXe siècle, commémoré avec ses compagnons.', ['Charles Lwanga', 'Ouganda', 'martyrs de l’Ouganda']],
  ['afrique-diaspora', 'saint-kizito', 'Saint Kizito', 'Jeune martyr ougandais, compagnon de Charles Lwanga.', ['Kizito', 'Ouganda', 'jeune martyr']],
  ['afrique-diaspora', 'bienheureuse-anwarite', 'Bienheureuse Anuarite Nengapeta', 'Religieuse congolaise morte en 1964 et reconnue martyre.', ['Anuarite', 'Nengapeta', 'Congo', 'RDC']],
  ['jeunesse-education', 'saint-jean-bosco', 'Saint Jean Bosco', 'Prêtre et éducateur, fondateur des Salésiens.', ['Don Bosco', 'jeunes', 'Salésiens']],
  ['jeunesse-education', 'saint-dominique-savio', 'Saint Dominique Savio', 'Jeune élève de Jean Bosco proposé comme modèle de jeunesse chrétienne.', ['Dominique Savio', 'jeunes']],
  ['jeunesse-education', 'saint-jean-baptiste-salle', 'Saint Jean-Baptiste de La Salle', 'Fondateur des Frères des Écoles chrétiennes et patron des éducateurs.', ['La Salle', 'éducation', 'enseignants']],
  ['jeunesse-education', 'sainte-angela-merici', 'Sainte Angèle Merici', 'Fondatrice de la Compagnie de Sainte-Ursule, engagée dans l’éducation des jeunes filles.', ['Angèle Merici', 'Ursulines', 'éducation']],
  ['charite-justice-sociale', 'saint-vincent-paul', 'Saint Vincent de Paul', 'Prêtre français associé à l’organisation durable du service des pauvres.', ['Vincent de Paul', 'charité']],
  ['charite-justice-sociale', 'sainte-louise-marillac', 'Sainte Louise de Marillac', 'Cofondatrice des Filles de la Charité avec Vincent de Paul.', ['Louise de Marillac', 'Filles de la Charité']],
  ['charite-justice-sociale', 'saint-damien-molokai', 'Saint Damien de Molokaï', 'Missionnaire belge ayant servi les personnes atteintes de la lèpre à Molokaï.', ['Damien de Veuster', 'Molokaï', 'malades']],
  ['charite-justice-sociale', 'sainte-katharine-drexel', 'Sainte Katharine Drexel', 'Fondatrice américaine engagée dans l’éducation et la dignité des populations marginalisées.', ['Katharine Drexel', 'éducation', 'justice sociale']],
  ['ermites-monachisme', 'saint-antoine-grand', 'Saint Antoine le Grand', 'Père du désert égyptien et figure fondatrice du monachisme chrétien.', ['Antoine d’Égypte', 'père du désert']],
  ['ermites-monachisme', 'saint-pacome', 'Saint Pacôme', 'Fondateur du cénobitisme chrétien en Égypte.', ['Pacôme', 'Égypte', 'monachisme']],
  ['ermites-monachisme', 'sainte-scolastique', 'Sainte Scholastique', 'Sœur de Benoît de Nursie selon la tradition et figure du monachisme féminin.', ['Scholastique', 'sœur de saint Benoît']],
  ['ermites-monachisme', 'saint-bruno', 'Saint Bruno', 'Fondateur de l’ordre des Chartreux.', ['Bruno le Chartreux', 'Chartreuse']],
  ['ermites-monachisme', 'saint-bernard-clairvaux', 'Saint Bernard de Clairvaux', 'Abbé cistercien, prédicateur et docteur de l’Église.', ['Bernard', 'Clairvaux', 'cistercien']],
];

const biblical = [
  ['jesus-selon-matthieu', 'Généalogie de Jésus selon Matthieu', 'Lignée structurée selon Matthieu 1, d’Abraham à Jésus, organisée en séries généalogiques.', ['Matthieu 1:1-17'], ['Jésus', 'Abraham', 'David', 'Matthieu']],
  ['jesus-selon-luc', 'Généalogie de Jésus selon Luc', 'Lignée ascendante selon Luc 3, de Jésus jusqu’à Adam.', ['Luc 3:23-38'], ['Jésus', 'Adam', 'Luc']],
  ['adam-a-noe', 'D’Adam à Noé', 'Premières générations bibliques depuis Adam jusqu’à Noé.', ['Genèse 5'], ['Adam', 'Seth', 'Noé', 'patriarches']],
  ['noe-a-abraham', 'De Noé à Abraham', 'Descendance de Sem conduisant à Abram dans le récit de la Genèse.', ['Genèse 10', 'Genèse 11:10-32'], ['Noé', 'Sem', 'Abraham']],
  ['abraham-israel', 'Maison d’Abraham et d’Israël', 'Familles d’Abraham, Isaac et Jacob, avec les branches d’Ismaël, Ésaü et des fils d’Israël.', ['Genèse 16-36'], ['Abraham', 'Isaac', 'Jacob', 'Israël']],
  ['douze-tribus-israel', 'Les douze tribus d’Israël', 'Structure familiale des fils de Jacob à l’origine des tribus d’Israël.', ['Genèse 29-30', 'Genèse 35:16-26', 'Genèse 46'], ['Jacob', 'Israël', 'tribus']],
  ['maison-de-david', 'Maison de David', 'Lignée royale associée à David et aux rois de Juda.', ['Ruth 4:18-22', '1 Chroniques 2-3'], ['David', 'Juda', 'rois']],
  ['lignage-sacerdotal-aaron', 'Lignage sacerdotal d’Aaron', 'Généalogie de la maison d’Aaron et des lignées sacerdotales mentionnées dans la Torah et les Chroniques.', ['Exode 6:14-27', '1 Chroniques 6'], ['Aaron', 'Lévi', 'prêtres']],
  ['descendance-cain', 'Descendance de Caïn', 'Lignée de Caïn jusqu’aux familles mentionnées avant le déluge.', ['Genèse 4:16-24'], ['Caïn', 'Hénoc', 'Lamek']],
  ['descendants-cham', 'Descendants de Cham', 'Branches attribuées à Cham dans la table des peuples.', ['Genèse 10:6-20', '1 Chroniques 1:8-16'], ['Cham', 'Canaan', 'Koush', 'Mitsraïm']],
  ['descendants-japhet', 'Descendants de Japhet', 'Branches attribuées à Japhet dans la table des peuples.', ['Genèse 10:2-5', '1 Chroniques 1:5-7'], ['Japhet', 'Gomer', 'Javan']],
  ['maison-esau-edom', 'Maison d’Ésaü et chefs d’Édom', 'Famille d’Ésaü, ses épouses, ses fils et les chefs d’Édom.', ['Genèse 36', '1 Chroniques 1:35-54'], ['Ésaü', 'Édom', 'Séir']],
  ['tribu-juda', 'Généalogies de la tribu de Juda', 'Lignées de Juda, de Pérets et des clans associés.', ['Genèse 38', '1 Chroniques 2-4'], ['Juda', 'Pérets', 'Hetsron']],
  ['tribu-benjamin', 'Généalogies de Benjamin', 'Maisons et clans associés à Benjamin, incluant la lignée de Saül.', ['1 Chroniques 7:6-12', '1 Chroniques 8-9'], ['Benjamin', 'Saül', 'Kish']],
  ['famille-moise', 'Famille de Moïse', 'Maison d’Amram, Moïse, Aaron et leurs proches selon les textes du Pentateuque.', ['Exode 2', 'Exode 6:14-27', 'Nombres 26:57-62'], ['Moïse', 'Aaron', 'Myriam', 'Amram']],
  ['maison-saul', 'Maison du roi Saül', 'Famille de Saül, Jonathan, Ish-Bosheth et descendants mentionnés dans Samuel et les Chroniques.', ['1 Samuel 9-14', '2 Samuel 2-4', '1 Chroniques 8:29-40'], ['Saül', 'Jonathan', 'Méphibosheth']],
  ['famille-noemi-ruth', 'Famille de Noémi et Ruth', 'Relations familiales reliant Élimélek, Noémi, Ruth, Booz et la lignée de David.', ['Ruth 1-4'], ['Noémi', 'Ruth', 'Booz', 'Obed']],
  ['familles-entourage-jesus', 'Familles de l’entourage de Jésus', 'Cartographie prudente des parentés explicitement nommées autour de Jésus dans les Évangiles.', ['Matthieu 13:55-56', 'Marc 6:3', 'Luc 1-2', 'Jean 19:25'], ['Jésus', 'Marie', 'Élisabeth', 'Zacharie', 'Jean-Baptiste']],
];

const readyArchives = new Map([
  ['saint-louis-ix', '../../../../saint-louis-ix/saint-louis-ix.geneatree.json'],
  ['sainte-elisabeth-de-hongrie', '../../../../sainte-elisabeth-de-hongrie/sainte-elisabeth-de-hongrie.geneatree.json'],
  ['sainte-marguerite-ecosse', '../../../../sainte-marguerite-ecosse/sainte-marguerite-ecosse.geneatree.json'],
]);

const entries = [];
async function writeEntry(kind, category, slug, title, description, aliases, passages = []) {
  const directory = path.join(catalogueRoot, kind, category, slug);
  await fs.mkdir(directory, { recursive: true });
  const archive = readyArchives.get(slug) ?? null;
  const metadata = {
    id: slug,
    kind: kind === 'saints' ? 'saint' : 'biblical-genealogy',
    category,
    title,
    description,
    aliases,
    searchText: [title, description, ...aliases, ...passages].join(' ').toLocaleLowerCase('fr'),
    scripturePassages: passages,
    status: {
      research: archive ? 'reviewed-seed' : 'planned',
      genealogy: archive ? 'available' : 'pending',
      images: 'pending',
    },
    archive,
    editorial: {
      tradition: kind === 'saints' ? 'christian' : 'biblical-text',
      historicalCertainty: 'to-review',
      notes: [],
      sources: [],
    },
  };
  await fs.writeFile(path.join(directory, 'metadata.json'), `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  await fs.writeFile(path.join(directory, 'sources.json'), `${JSON.stringify({ primary: passages, secondary: [], imageSources: [] }, null, 2)}\n`, 'utf8');
  entries.push({ id: slug, kind: metadata.kind, category, title, description, aliases, status: metadata.status, metadata: path.relative(catalogueRoot, path.join(directory, 'metadata.json')).replaceAll('\\', '/') });
}

for (const category of categories) await fs.mkdir(path.join(catalogueRoot, 'saints', category.id), { recursive: true });
for (const [category, slug, title, description, aliases] of saints) await writeEntry('saints', category, slug, title, description, aliases);
for (const [slug, title, description, passages, aliases] of biblical) await writeEntry('genealogies-bibliques', 'recits-et-lignages', slug, title, description, aliases, passages);

await fs.writeFile(path.join(catalogueRoot, 'catalog.json'), `${JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), categories, biblicalCategory: { id: 'recits-et-lignages', label: 'Généalogies bibliques', description: 'Lignages reconstruits séparément selon les passages bibliques, sans fusion automatique des traditions textuelles.' }, filters: ['kind', 'category', 'status.research', 'status.genealogy', 'status.images', 'aliases', 'scripturePassages'], entries }, null, 2)}\n`, 'utf8');
console.log(`Catalogue structuré : ${entries.length} fiches (${saints.length} saints, ${biblical.length} généalogies bibliques).`);
