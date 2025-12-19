// Běžná slova pro hru Kufr (1000+ slov)
export const normalWords: string[] = [
  // Zvířata
  "pes", "kočka", "slon", "žirafa", "lev", "tygr", "medvěd", "vlk", "liška", "zajíc",
  "králík", "myš", "krysa", "had", "želva", "krokodýl", "žába", "ryba", "žralok", "delfín",
  "velryba", "tučňák", "orel", "sova", "papoušek", "holub", "vrána", "kachna", "husa", "kohout",
  "slepice", "kráva", "býk", "kůň", "osel", "prase", "ovce", "koza", "ježek", "veverka",
  "opice", "gorila", "šimpanz", "zebra", "hroch", "nosorožec", "panda", "koala", "klokan", "lenochod",
  "mravenec", "včela", "motýl", "moucha", "komár", "pavouk", "šnek", "červ", "žížala", "chobotnice",
  
  // Jídlo a pití
  "jablko", "hruška", "banán", "pomeranč", "citron", "třešeň", "jahoda", "malina", "borůvka", "meloun",
  "ananas", "mango", "kiwi", "broskev", "švestka", "hrozno", "rajče", "okurka", "paprika", "mrkev",
  "brambora", "cibule", "česnek", "salát", "zelí", "květák", "brokolice", "kukuřice", "hrášek", "fazole",
  "chléb", "rohlík", "houska", "croissant", "dort", "koláč", "buchta", "zmrzlina", "čokoláda", "bonbon",
  "sýr", "máslo", "jogurt", "mléko", "vejce", "šunka", "salám", "párek", "kuře", "ryba",
  "polévka", "guláš", "řízek", "špagety", "pizza", "hamburger", "sendvič", "hranolky", "kečup", "hořčice",
  "káva", "čaj", "limonáda", "džus", "voda", "pivo", "víno", "sůl", "cukr", "mouka",
  
  // Doprava
  "auto", "autobus", "vlak", "tramvaj", "metro", "letadlo", "loď", "kolo", "motorka", "skútr",
  "kamion", "traktor", "bagr", "jeřáb", "sanitka", "hasičák", "policie", "taxi", "helikoptéra", "balón",
  "raketa", "ponorka", "člun", "jachta", "koloběžka", "skateboard", "brusle", "lyže", "sáňky", "vrtulník",
  
  // Profese
  "učitel", "doktor", "hasič", "policista", "kuchař", "číšník", "prodavač", "řidič", "pilot", "kapitán",
  "farmář", "zahradník", "malíř", "hudebník", "herec", "zpěvák", "tanečník", "sportovec", "fotbalista", "hokejista",
  "plavec", "běžec", "gymnasta", "boxer", "tenista", "golfista", "lyžař", "cyklista", "jezdec", "kouzelník",
  "klaun", "bavič", "novinář", "fotograf", "kameraman", "režisér", "programátor", "inženýr", "architekt", "právník",
  "účetní", "sekretářka", "ředitel", "manažer", "prezident", "král", "královna", "princ", "princezna", "rytíř",
  
  // Domácnost
  "stůl", "židle", "postel", "křeslo", "gauč", "skříň", "komoda", "police", "zrcadlo", "obraz",
  "lampa", "lustry", "koberec", "závěsy", "hodiny", "televize", "rádio", "počítač", "telefon", "pračka",
  "lednice", "sporák", "trouba", "mikrovlnka", "rychlovarná", "mixér", "toustovač", "žehlička", "vysavač", "smeták",
  "kbelík", "mop", "hadr", "kartáč", "hřeben", "nůžky", "jehla", "nit", "knoflík", "zip",
  "hrnek", "sklenice", "talíř", "miska", "příbor", "vidlička", "nůž", "lžíce", "hrnec", "pánev",
  
  // Sport a hry
  "fotbal", "hokej", "tenis", "basketbal", "volejbal", "baseball", "golf", "box", "judo", "karate",
  "plavání", "běh", "skok", "hod", "lyžování", "bruslení", "snowboard", "surfování", "potápění", "lezení",
  "šachy", "dáma", "karty", "puzzle", "kostky", "domino", "pexeso", "člověče", "monopoly", "scrabble",
  "míč", "raketa", "hokejka", "pálka", "branka", "koš", "síť", "medaile", "pohár", "trofej",
  
  // Příroda
  "strom", "květina", "tráva", "keř", "les", "park", "zahrada", "louka", "pole", "hora",
  "kopec", "údolí", "řeka", "jezero", "moře", "oceán", "vodopád", "pramen", "studna", "rybník",
  "ostrov", "poloostrov", "poušť", "džungle", "savana", "tundra", "ledovec", "sopka", "jeskyně", "pláž",
  "slunce", "měsíc", "hvězda", "mrak", "déšť", "sníh", "bouřka", "blesk", "duha", "vítr",
  "rosa", "mlha", "led", "jinovatka", "kroupy", "tornádo", "hurikán", "tsunami", "zemětřesení", "lavina",
  
  // Oblečení
  "tričko", "košile", "svetr", "mikina", "bunda", "kabát", "sako", "vesta", "kalhoty", "džíny",
  "sukně", "šaty", "pyžamo", "župan", "plavky", "ponožky", "punčochy", "boty", "tenisky", "sandály",
  "pantofle", "holínky", "čepice", "klobouk", "šála", "rukavice", "pásek", "kravata", "motýlek", "náušnice",
  "náhrdelník", "prsten", "náramek", "hodinky", "brýle", "kabelka", "batoh", "deštník", "slunečník", "kapesník",
  
  // Tělo
  "hlava", "vlasy", "čelo", "obočí", "oko", "nos", "ucho", "tvář", "ústa", "rty",
  "jazyk", "zuby", "brada", "krk", "rameno", "paže", "loket", "ruka", "prst", "nehet",
  "hrudník", "záda", "břicho", "pupek", "noha", "stehno", "koleno", "lýtko", "kotník", "chodidlo",
  "pata", "palec", "srdce", "plíce", "mozek", "kost", "sval", "kůže", "krev", "žíla",
  
  // Budovy a místa
  "dům", "byt", "vila", "chata", "hrad", "zámek", "kostel", "klášter", "škola", "univerzita",
  "nemocnice", "lékárna", "obchod", "supermarket", "restaurace", "kavárna", "bar", "hotel", "kino", "divadlo",
  "muzeum", "galerie", "knihovna", "stadion", "bazén", "posilovna", "zoo", "cirkus", "park", "náměstí",
  "ulice", "most", "tunel", "věž", "mrakodrap", "maják", "letiště", "přístav", "nádraží", "stanice",
  "benzínka", "myčka", "garáž", "sklep", "půda", "balkon", "terasa", "veranda", "komín", "střecha",
  
  // Nástroje a předměty
  "kladivo", "šroubovák", "kleště", "pilka", "sekera", "lopata", "hrábě", "konev", "hadice", "žebřík",
  "lano", "řetěz", "zámek", "klíč", "dveře", "okno", "schody", "výtah", "eskalátor", "brzda",
  "volant", "pedál", "sedadlo", "motor", "kola", "baterie", "žárovka", "zásuvka", "kabel", "vypínač",
  "svíčka", "zápalky", "zapalovač", "baterka", "kompas", "mapa", "dalekohled", "mikroskop", "lupa", "váhy",
  
  // Hudba a umění
  "kytara", "piano", "housle", "buben", "trubka", "flétna", "saxofon", "harmonika", "harfa", "kontrabas",
  "mikrofon", "sluchátka", "reproduktor", "zesilovač", "nota", "píseň", "melodie", "rytmus", "koncert", "opera",
  "balet", "tanec", "malba", "socha", "kresba", "fotka", "film", "seriál", "reklama", "plakát",
  "kniha", "časopis", "noviny", "dopis", "pohled", "tužka", "pero", "štětec", "barva", "plátno",
  
  // Škola a vzdělání
  "tabule", "křída", "houba", "sešit", "učebnice", "slovník", "pravítko", "kružítko", "úhloměr", "kalkulačka",
  "taška", "penál", "guma", "ořezávátko", "lepidlo", "páska", "spona", "sešívačka", "děrovačka", "razítko",
  "globus", "atlas", "encyklopedie", "diplom", "vysvědčení", "zkouška", "test", "úkol", "referát", "prezentace",
  
  // Rodina a vztahy
  "máma", "táta", "bratr", "sestra", "babička", "dědeček", "teta", "strýc", "bratranec", "sestřenice",
  "manžel", "manželka", "syn", "dcera", "vnuk", "vnučka", "tchán", "tchyně", "zeť", "snacha",
  "přítel", "kamarád", "soused", "spolužák", "kolega", "šéf", "partner", "milenec", "nepřítel", "rival",
  
  // Emoce a stavy
  "radost", "smutek", "strach", "hněv", "láska", "nenávist", "závist", "žárlivost", "naděje", "zklamání",
  "překvapení", "údiv", "nuda", "vzrušení", "klid", "stres", "úzkost", "panika", "štěstí", "neštěstí",
  "pýcha", "stud", "vina", "lítost", "odpuštění", "vděčnost", "soucit", "empatie", "sympatie", "antipatie",
  
  // Čas a míra
  "vteřina", "minuta", "hodina", "den", "týden", "měsíc", "rok", "století", "ráno", "poledne",
  "odpoledne", "večer", "noc", "půlnoc", "svítání", "soumrak", "jaro", "léto", "podzim", "zima",
  "metr", "kilometr", "centimetr", "milimetr", "gram", "kilogram", "litr", "stupeň", "procento", "polovina",
  
  // Akce a činnosti
  "chůze", "běh", "skok", "pád", "let", "plavání", "lezení", "tancování", "zpěv", "hraní",
  "čtení", "psaní", "kreslení", "malování", "vaření", "pečení", "šití", "pletení", "praní", "žehlení",
  "uklízení", "nakupování", "cestování", "spánek", "snění", "myšlení", "učení", "práce", "odpočinek", "zábava",
  
  // Pohádky a fantasy
  "víla", "čaroděj", "čarodějnice", "drak", "jednorožec", "skřítek", "trpaslík", "obr", "vlkodlak", "upír",
  "zombi", "mumie", "kostlivec", "duch", "strašidlo", "příšera", "monster", "robot", "mimozemšťan", "superhrdina",
  "meč", "štít", "hůlka", "koště", "plášť", "koruna", "žezlo", "trůn", "poklad", "mapa",
  
  // Věda a technika
  "atom", "molekula", "buňka", "gen", "virus", "bakterie", "energie", "síla", "rychlost", "teplota",
  "světlo", "zvuk", "elektřina", "magnetismus", "gravitace", "vesmír", "planeta", "galaxie", "černá díra", "kometa",
  "laser", "radar", "sonar", "rentgen", "ultrazvuk", "internet", "software", "hardware", "data", "algoritmus",
  
  // Dopravní značky a pravidla
  "semafor", "přechod", "křižovatka", "kruhový objezd", "dálnice", "silnice", "chodník", "zastávka", "parkoviště", "garáž",
  
  // Geometrie a tvary
  "kruh", "čtverec", "obdélník", "trojúhelník", "hvězda", "srdce", "šipka", "spirála", "vlna", "čára",
  "bod", "úhel", "rovnoběžka", "kolmice", "průměr", "poloměr", "obvod", "plocha", "objem", "kvádr",
  
  // Barvy a materiály
  "červená", "modrá", "zelená", "žlutá", "oranžová", "fialová", "růžová", "hnědá", "černá", "bílá",
  "šedá", "zlatá", "stříbrná", "bronzová", "dřevo", "kov", "sklo", "plast", "papír", "látka",
  "kůže", "guma", "beton", "cihla", "kámen", "písek", "hlína", "led", "sníh", "oheň",
  
  // Čísla a matematika
  "nula", "jednička", "dvojka", "trojka", "čtyřka", "pětka", "šestka", "sedmička", "osmička", "devítka",
  "desítka", "stovka", "tisícovka", "milion", "miliarda", "plus", "minus", "krát", "děleno", "rovná se",
  
  // Směry a pozice
  "nahoru", "dolů", "vlevo", "vpravo", "vpředu", "vzadu", "uvnitř", "venku", "nahoře", "dole",
  "vedle", "mezi", "kolem", "přes", "pod", "nad", "před", "za", "blízko", "daleko",
  
  // Svátky a oslavy
  "narozeniny", "svatba", "křtiny", "promoce", "výročí", "silvestr", "velikonoce", "halloween", "valentýn", "svátek",
  "párty", "oslava", "hostina", "dárek", "dort", "svíčka", "balónek", "konfety", "ohňostroj", "petarda",
  
  // Kancelář a administrativa
  "papír", "složka", "šanon", "obálka", "známka", "poštovní", "schránka", "kopírka", "tiskárna", "skener",
  "fax", "projektor", "plátno", "flipchart", "nástěnka", "kalendář", "diář", "notes", "zápisník", "blok",
  
  // Zahrada a venkov
  "stodola", "seník", "kurník", "chlív", "studna", "plot", "brána", "lavička", "houpačka", "pískoviště",
  "bazén", "skleník", "kompost", "záhon", "trávník", "živý plot", "fontána", "socha", "altán", "pergola",
  
  // Kuchyně a vaření
  "recept", "ingredience", "míchání", "krájení", "strouhání", "loupání", "drcení", "hnětení", "válení", "pečení",
  "smažení", "vaření", "dušení", "grilování", "marinování", "solení", "kořenění", "chuť", "vůně", "textura",
  
  // Nemoci a zdraví
  "rýma", "kašel", "chřipka", "horečka", "bolest", "zlomenina", "vyrážka", "alergie", "astma", "cukrovka",
  "operace", "injekce", "obvaz", "sádra", "berle", "vozík", "lék", "pilulka", "sirup", "mast",
  
  // Právo a společnost
  "zákon", "pravidlo", "právo", "povinnost", "svoboda", "spravedlnost", "soud", "soudce", "advokát", "obžalovaný",
  "svědek", "důkaz", "rozsudek", "vězení", "pokuta", "trest", "amnestie", "milost", "volby", "hlasování",
  
  // Komunikace
  "řeč", "jazyk", "slovo", "věta", "otázka", "odpověď", "prosba", "rozkaz", "pozdrav", "rozloučení",
  "děkuji", "prosím", "promiň", "ahoj", "sbohem", "ano", "ne", "možná", "určitě", "nikdy",
  
  // Další běžná slova
  "věc", "místo", "čas", "způsob", "důvod", "cíl", "začátek", "konec", "problém", "řešení",
  "nápad", "plán", "změna", "pokrok", "úspěch", "neúspěch", "chyba", "omyl", "pravda", "lež",
  "tajemství", "překvapení", "zázrak", "sen", "skutečnost", "minulost", "přítomnost", "budoucnost", "vzpomínka", "představa"
];

// Vánoční slova
export const christmasWords: string[] = [
  // Základní vánoční pojmy
  "vánoce", "štědrý den", "betlém", "jesličky", "ježíšek", "anděl", "hvězda", "kometa", "pastýř", "tři králové",
  "myra", "kadidlo", "zlato", "chlév", "jesle", "sláma", "osel", "vůl", "ovečka", "beránek",
  
  // Vánoční dekorace
  "stromeček", "ozdoba", "řetěz", "lameta", "koule", "špička", "svíčka", "adventní věnec", "jmelí", "cesmína",
  "vánoční hvězda", "světýlka", "girlanda", "sněhulák", "sob", "sáně", "zvoneček", "rolnička", "mašle", "stuha",
  
  // Vánoční jídlo a pití
  "kapr", "bramborový salát", "řízek", "cukroví", "vánočka", "linecké", "vanilkové rohlíčky", "pracny", "perníčky", "štrůdl",
  "punč", "svařák", "vaječný koňak", "medovník", "makový závin", "ořechový závin", "vánoční štola", "marzipán", "marcipán", "čokoládové pralinky",
  
  // Dárky a obdarování
  "dárek", "balení", "papír", "mašle", "stuha", "přání", "pohled", "obálka", "překvapení", "radost",
  "štědrost", "laskavost", "pomoc", "charita", "dobrovolník", "adopce", "sponzor", "sbírka", "nadace", "podpora",
  
  // Zimní počasí
  "sníh", "vločka", "závěj", "námraza", "jinovatka", "led", "mráz", "zima", "chlad", "teplota",
  "sněžení", "vánice", "bouře", "vítr", "fujavice", "plískanice", "náledí", "kluzko", "bílo", "zimní",
  
  // Zimní aktivity
  "bobování", "sáňkování", "lyžování", "bruslení", "koulování", "stavění sněhuláka", "iglú", "andělíček ve sněhu", "běžky", "snowboard",
  
  // Vánoční tradice
  "koleda", "koledník", "zpívání", "půlnoční mše", "jesličky", "betlém", "adventní kalendář", "svíčka", "věneček", "tradice",
  "rodinná večeře", "štědrovečerní", "kapr", "šupina", "rybí polévka", "bramborový salát", "krájení jablka", "házení střevícem", "lití olova", "vánoční pohádka",
  
  // Santa a spol.
  "santa claus", "děda mráz", "sněhurka", "mikuláš", "čert", "anděl", "pytel", "vousy", "červený kabát", "sob",
  "rudolph", "sob rudolf", "severní pól", "dílna", "elfové", "skřítkové", "továrna", "seznam", "hodný", "zlobivý",
  
  // Vánoční hudba a kultura
  "koleda", "vánoční píseň", "zvonky", "rolničky", "tichá noc", "narodil se kristus pán", "nesem vám noviny", "vánoční koncert", "sbor", "orchestr",
  "vánoční pohádka", "popelka", "tři oříšky", "anděl páně", "s tebou mě baví svět", "pyšná princezna", "princezna se zlatou hvězdou", "lotrando a zubejda", "sněhová královna", "vánoční příběh",
  
  // Vánoční atmosféra
  "pohoda", "klid", "láska", "rodina", "setkání", "společnost", "přátelé", "teplo", "krb", "oheň",
  "útulno", "domov", "harmonie", "soulad", "radost", "štěstí", "naděje", "víra", "modlitba", "požehnání",
  
  // Vánoční trhy
  "stánek", "trhovnice", "punč", "svařené víno", "medovina", "párek", "klobása", "trdelník", "langoš", "bramborák",
  "výrobky", "rukodělné", "dárek", "dekorace", "keramika", "svíčky", "mýdla", "šály", "rukavice", "čepice",
  
  // Adventní čas
  "advent", "adventní", "čtyři neděle", "první svíce", "druhá svíce", "třetí svíce", "čtvrtá svíce", "očekávání", "příprava", "těšení",
  "adventní kalendář", "okénko", "čokoláda", "překvapení", "odpočítávání", "tradice", "zvyk", "rituál", "obyčej", "zvyklost",
  
  // Nový rok
  "silvestr", "nový rok", "ohňostroj", "petardy", "prskavky", "přípitek", "šampaňské", "sekáče", "předsevzetí", "půlnoc",
  "odpočítávání", "oslava", "párty", "tancování", "veselí", "přání", "zdraví", "štěstí", "láska", "úspěch",
  
  // Další vánoční slova
  "dárková krabička", "sváteční", "slavnostní", "zimní krajina", "zasněžený", "ledový", "třpytivý", "zářivý", "kouzelný", "magický",
  "zázračný", "podivuhodný", "úžasný", "nádherný", "krásný", "překrásný", "skvělý", "výborný", "prima", "super"
];

// Funkce pro zamíchání pole
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
