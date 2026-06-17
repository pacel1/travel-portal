import type { LocaleCode } from "@/lib/i18n";

type EditorialEntry = Partial<Record<LocaleCode, string>>;

/**
 * Hand-written, fact-grounded editorial — one short paragraph per city, keyed by
 * the raw `citySlug`. Written to be genuinely specific to each place (durable
 * character, geography, how the climate plays out for visiting), NOT templated
 * filler and NOT auto-generated. For lesser-known towns the note is deliberately
 * cautious — only verifiable geography, region, and climate, with no invented
 * landmarks, dates, or claims.
 *
 * Cities without an entry fall back to the data-derived intro.
 */
export const cityEditorial: Record<string, EditorialEntry> = {
  // ── Germany ────────────────────────────────────────────────────────────
  augsburg: {
    en: "One of Germany's oldest cities, founded in Roman times, Augsburg sits in Bavaria within easy reach of Munich. Its Renaissance heritage and the historic Fuggerei almshouses anchor a compact centre best enjoyed in the mild half of the year, as winters here are cold and grey.",
    pl: "Jedno z najstarszych niemieckich miast, założone w czasach rzymskich, Augsburg leży w Bawarii w zasięgu krótkiego wypadu z Monachium. Renesansowe dziedzictwo i zabytkowe osiedle Fuggerei tworzą zwarte centrum, najprzyjemniejsze w cieplejszej połowie roku — zimy bywają tu mroźne i szare.",
  },
  berlin: {
    en: "Berlin wears its history in the open — the Brandenburg Gate, remnants of the Wall, and Museum Island — wrapped in a famously informal, creative energy. Flat and inland, it runs cold in winter and pleasantly warm in summer, when its parks, canals and beer gardens come into their own.",
    pl: "Berlin nosi historię na wierzchu — Brama Brandenburska, fragmenty muru i Wyspa Muzeów — owiniętą w nieformalną, twórczą energię. Płaski i położony w głębi lądu, bywa mroźny zimą i przyjemnie ciepły latem, gdy ożywają parki, kanały i ogródki piwne.",
  },
  bremen: {
    en: "A Hanseatic port in Germany's north, Bremen pairs a storybook market square and the Town Musicians statue with a working maritime edge along the Weser. Its northern, sea-influenced climate is mild but damp, so pack for changeable skies year-round.",
    pl: "Hanzeatycki port na północy Niemiec, Brema łączy bajkowy rynek i pomnik Muzykantów z Bremy z portowym charakterem nad Wezerą. Północny, morski klimat jest łagodny, lecz wilgotny, więc przez cały rok warto liczyć się ze zmiennym niebem.",
  },
  dresden: {
    en: "Dresden's Baroque skyline along the Elbe — the rebuilt Frauenkirche, the Zwinger — is one of Germany's great urban restorations. Inland in Saxony, it has cold winters and warm summers; the riverbank terraces are at their best from late spring onward.",
    pl: "Barokowa panorama Drezna nad Łabą — odbudowany kościół Frauenkirche i pałac Zwinger — to jedna z największych miejskich rekonstrukcji w Niemczech. Położone w głębi Saksonii ma mroźne zimy i ciepłe lata; nadrzeczne tarasy są najpiękniejsze od późnej wiosny.",
  },
  dusseldorf: {
    en: "On the Rhine, Düsseldorf blends business and fashion with a lively old town nicknamed 'the longest bar in the world'. The Rhineland climate is mild and often wet, making the spring-to-early-autumn stretch the easiest for riverside strolls.",
    pl: "Nad Renem Düsseldorf łączy biznes i modę z gwarną starówką zwaną „najdłuższym barem świata”. Nadreński klimat jest łagodny i często wilgotny, więc okres od wiosny do wczesnej jesieni najlepiej sprzyja spacerom nad rzeką.",
  },
  erfurt: {
    en: "The capital of Thuringia, Erfurt keeps a remarkably intact medieval centre, crowned by the Krämerbrücke — a bridge lined with shops and houses. It sits inland with cold winters and warm summers; the cobbled lanes are most rewarding in the milder months.",
    pl: "Stolica Turyngii, Erfurt zachowała wyjątkowo nienaruszone średniowieczne centrum z mostem Krämerbrücke, obudowanym sklepami i domami. Leży w głębi lądu, ma mroźne zimy i ciepłe lata; brukowane uliczki najlepiej zwiedzać w łagodniejszych miesiącach.",
  },
  hamburg: {
    en: "Germany's great port city is laced with canals and harbour basins, from the warehouse district of Speicherstadt to the Elbphilharmonie. Its maritime climate is cool and rainy, so bring a jacket whenever you visit and aim for the longer, milder days of summer.",
    pl: "Wielki port Niemiec poprzecinany jest kanałami i basenami portowymi, od dzielnicy magazynów Speicherstadt po Elbphilharmonie. Morski klimat jest chłodny i deszczowy, więc kurtka przyda się o każdej porze, a najlepiej celować w dłuższe, łagodniejsze dni lata.",
  },
  hannover: {
    en: "A Lower Saxon hub known for its trade fairs and the grand Herrenhausen Gardens, Hannover is greener and calmer than its business reputation suggests. The northern climate is mild and damp, with the gardens at their peak across late spring and summer.",
    pl: "Ośrodek Dolnej Saksonii znany z targów i okazałych ogrodów Herrenhausen, Hanower jest bardziej zielony i spokojny, niż sugeruje jego biznesowa renoma. Północny klimat jest łagodny i wilgotny, a ogrody wypadają najlepiej późną wiosną i latem.",
  },
  karlsruhe: {
    en: "Karlsruhe is unusual for its fan-shaped plan, with streets radiating from the palace, and it sits near the Black Forest and the French border. The Upper Rhine climate is among Germany's mildest, making it comfortable across a long spring-to-autumn window.",
    pl: "Karlsruhe wyróżnia się wachlarzowym układem ulic rozchodzących się od pałacu i leży blisko Schwarzwaldu oraz granicy z Francją. Klimat górnego Renu należy do najłagodniejszych w Niemczech, więc miasto jest wygodne przez długi okres od wiosny do jesieni.",
  },
  kiel: {
    en: "A Baltic port at the end of a long fjord, Kiel is all about the sea — sailing regattas, ferries and waterfront walks. Its northern coastal climate is cool and breezy, so summer is comfortably the best time to catch the harbour at its liveliest.",
    pl: "Bałtycki port na końcu długiego fiordu, Kilonia żyje morzem — regatami, promami i spacerami nad wodą. Północny, nadmorski klimat jest chłodny i wietrzny, więc lato jest zdecydowanie najlepszym czasem, by zastać port w pełni życia.",
  },
  koln: {
    en: "Cologne is defined by its twin-spired Gothic cathedral rising over the Rhine, by Carnival, and by an easygoing Rhineland spirit. The climate is mild and frequently wet; spring through early autumn offers the most reliable weather for the riverside and old town.",
    pl: "Kolonię definiuje gotycka katedra o dwóch wieżach górująca nad Renem, karnawał i swobodny nadreński charakter. Klimat jest łagodny i często wilgotny; od wiosny do wczesnej jesieni pogoda nad rzeką i na starówce jest najpewniejsza.",
  },
  magdeburg: {
    en: "On the Elbe in Saxony-Anhalt, Magdeburg mixes a historic cathedral with bold modern landmarks and broad, rebuilt avenues. Inland and continental, it has cold winters and warm summers best suited to riverside time from late spring on.",
    pl: "Nad Łabą w Saksonii-Anhalt Magdeburg łączy zabytkową katedrę ze śmiałymi nowoczesnymi obiektami i szerokimi, odbudowanymi alejami. Położony w głębi lądu, ma kontynentalne, mroźne zimy i ciepłe lata, sprzyjające pobytowi nad rzeką od późnej wiosny.",
  },
  mainz: {
    en: "A Rhine city tied to Gutenberg and the printing press, Mainz sits at the heart of a wine region and keeps a relaxed, festive streak. The Rhine-Main climate is mild, with the wine taverns and riverfront liveliest from late spring through autumn.",
    pl: "Miasto nad Renem związane z Gutenbergiem i drukiem, Moguncja leży w sercu regionu winiarskiego i zachowuje wyluzowany, świąteczny rys. Klimat Renu i Menu jest łagodny, a winiarnie i nabrzeże tętnią życiem od późnej wiosny po jesień.",
  },
  munich: {
    en: "Bavaria's capital balances polished tradition — Marienplatz, beer halls, the English Garden — with the Alps an easy day trip away. Its climate is more continental than much of Germany, with cold, sometimes snowy winters and warm summers crowned by Oktoberfest.",
    pl: "Stolica Bawarii łączy dopracowaną tradycję — Marienplatz, piwiarnie, Ogród Angielski — z Alpami w zasięgu jednodniowej wycieczki. Klimat jest bardziej kontynentalny niż w większości Niemiec: mroźne, czasem śnieżne zimy i ciepłe lata zwieńczone Oktoberfest.",
  },
  munster: {
    en: "Münster, in Westphalia, is famously bike-friendly, with the arcaded Prinzipalmarkt and a history tied to the Peace of Westphalia. Often rainy under its northwestern skies, it's most pleasant for cycling and strolling in the warmer months.",
    pl: "Münster w Westfalii słynie z przyjazności rowerom, podcieni Prinzipalmarkt i historii związanej z pokojem westfalskim. Pod północno-zachodnim niebem bywa deszczowo, więc na rower i spacery najlepiej wybrać cieplejsze miesiące.",
  },
  potsdam: {
    en: "Just outside Berlin, Potsdam is a city of Prussian palaces and parkland, with Sanssouci its centrepiece, set among lakes and gardens. The climate matches Berlin's — cold winters, warm summers — and the grounds are at their finest from late spring through summer.",
    pl: "Tuż za Berlinem Poczdam to miasto pruskich pałaców i parków, z Sanssouci na czele, pośród jezior i ogrodów. Klimat jest jak w Berlinie — mroźne zimy, ciepłe lata — a założenia parkowe wyglądają najpiękniej od późnej wiosny po lato.",
  },
  saarbrucken: {
    en: "Capital of the Saarland on the French border, Saarbrücken carries a cross-border, post-industrial character along the Saar river. Its climate is among the milder in Germany, comfortable for exploring across the spring-to-autumn stretch.",
    pl: "Stolica Kraju Saary przy granicy z Francją, Saarbrücken ma transgraniczny, postindustrialny charakter nad rzeką Saarą. Klimat należy do łagodniejszych w Niemczech, wygodny do zwiedzania od wiosny do jesieni.",
  },
  schwerin: {
    en: "Schwerin, in Mecklenburg, is ringed by lakes and famous for its fairy-tale castle set on an island. Northern and sea-influenced, its summers are mild and its winters cold; the lakeside setting is loveliest in the long days of summer.",
    pl: "Schwerin w Meklemburgii otaczają jeziora, a jego wizytówką jest bajkowy zamek na wyspie. Północny, z wpływem morza, ma łagodne lata i mroźne zimy; nadjeziorna sceneria jest najpiękniejsza w długie letnie dni.",
  },
  stuttgart: {
    en: "Stuttgart spreads across hills and a valley basin, home to Mercedes and Porsche and ringed, unusually for a big city, by vineyards. Its sheltered position gives warm summers and mild winters, with the surrounding slopes greenest from late spring on.",
    pl: "Stuttgart rozłożył się na wzgórzach i w kotlinie doliny; to dom Mercedesa i Porsche, otoczony — nietypowo jak na duże miasto — winnicami. Osłonięte położenie daje ciepłe lata i łagodne zimy, a okoliczne stoki zielenią się najbardziej od późnej wiosny.",
  },
  wiesbaden: {
    en: "An elegant spa town near Frankfurt, Wiesbaden grew around thermal springs and keeps a Belle Époque polish. The sheltered Rhine-Main climate is mild, making its colonnades and gardens enjoyable across much of the year.",
    pl: "Eleganckie uzdrowisko niedaleko Frankfurtu, Wiesbaden wyrosło wokół gorących źródeł i zachowuje sznyt belle époque. Osłonięty klimat Renu i Menu jest łagodny, dzięki czemu kolumnady i ogrody cieszą przez większość roku.",
  },

  // ── Poland ─────────────────────────────────────────────────────────────
  bialystok: {
    en: "The largest city of Poland's north-east, Białystok is known for the grand Branicki Palace and sits close to the Białowieża primeval forest. Its eastern, continental climate brings genuinely cold, snowy winters and warm summers, the easiest season to combine the city with the surrounding nature.",
    pl: "Największe miasto północno-wschodniej Polski, Białystok słynie z okazałego Pałacu Branickich i leży blisko Puszczy Białowieskiej. Wschodni, kontynentalny klimat daje naprawdę mroźne, śnieżne zimy i ciepłe lata — najłatwiejszą porę, by połączyć miasto z okoliczną przyrodą.",
  },
  bydgoszcz: {
    en: "Bydgoszcz, in north-central Poland, is shaped by water — the Brda river and a historic canal lined with restored granaries. The climate is temperate and continental, with the waterfront and islands at their best in the warmer half of the year.",
    pl: "Bydgoszcz w północno-środkowej Polsce kształtuje woda — rzeka Brda i zabytkowy kanał z odrestaurowanymi spichrzami. Klimat jest umiarkowany i kontynentalny, a nabrzeże i wyspy najlepiej wyglądają w cieplejszej połowie roku.",
  },
  gdansk: {
    en: "A Baltic port with a rebuilt Hanseatic core, Gdańsk lines the Motława with tall merchant houses and carries deep Solidarity history. Cool and maritime, it's busiest and brightest in summer, when the long coast and Długi Targ fill with visitors.",
    pl: "Bałtycki port z odbudowanym hanzeatyckim centrum, Gdańsk obstawia Motławę wysokimi kamienicami i niesie ważną historię Solidarności. Chłodny i morski, jest najgwarniejszy i najjaśniejszy latem, gdy długie wybrzeże i Długi Targ wypełniają się turystami.",
  },
  "gorzow-wielkopolski": {
    en: "Gorzów Wielkopolski is a riverside city in western Poland on the Warta, close to the German border. Its temperate continental climate follows the regional pattern of cold winters and warm summers, with the milder months best for time outdoors.",
    pl: "Gorzów Wielkopolski to nadrzeczne miasto w zachodniej Polsce nad Wartą, blisko granicy z Niemcami. Umiarkowany, kontynentalny klimat trzyma się regionalnego wzorca mroźnych zim i ciepłych lat, a łagodniejsze miesiące najlepiej sprzyjają pobytowi na zewnątrz.",
  },
  katowice: {
    en: "The heart of Upper Silesia, Katowice has reinvented its mining past into a modern cultural district around the Spodek arena and a UNESCO-recognised music scene. Inland and continental, it's most comfortable to explore from late spring through early autumn.",
    pl: "Serce Górnego Śląska, Katowice przekuły górniczą przeszłość w nowoczesną dzielnicę kultury wokół hali Spodek i docenioną przez UNESCO scenę muzyczną. Położone w głębi lądu, są najwygodniejsze do zwiedzania od późnej wiosny po wczesną jesień.",
  },
  kielce: {
    en: "Kielce sits in south-central Poland at the edge of the Świętokrzyskie Mountains, with a Baroque bishops' palace anchoring its centre. The continental climate and nearby hills make late spring to early autumn the natural window for visiting.",
    pl: "Kielce leżą w środkowo-południowej Polsce u podnóża Gór Świętokrzyskich, a centrum spina barokowy pałac biskupi. Kontynentalny klimat i pobliskie wzgórza sprawiają, że naturalną porą na wizytę jest okres od późnej wiosny do wczesnej jesieni.",
  },
  krakow: {
    en: "Kraków packs its highlights into a compact, walkable core: the vast Main Market Square, Wawel Castle above the Vistula, and the Kazimierz district just to the south. Sitting inland in southern Poland, it has cold, often foggy winters and warm summers — late spring and early autumn give the most reliable daylight for the Old Town without the July–August peak.",
    pl: "Kraków mieści najważniejsze atrakcje w zwartym, pieszym centrum: ogromny Rynek Główny, Wawel nad Wisłą i sąsiedni Kazimierz. Leży w głębi lądu na południu Polski, ma więc chłodne, często mgliste zimy i ciepłe lata — późna wiosna i wczesna jesień dają najpewniejsze światło na zwiedzanie Starówki, bez szczytu z lipca i sierpnia.",
  },
  lublin: {
    en: "The largest city of eastern Poland, Lublin guards an atmospheric old town and a hilltop castle, long a meeting point between west and east. Its continental climate runs to cold winters and warm summers, with the cobbled centre most inviting in the milder months.",
    pl: "Największe miasto wschodniej Polski, Lublin strzeże klimatycznej starówki i zamku na wzgórzu, od wieków będąc punktem spotkania zachodu i wschodu. Kontynentalny klimat to mroźne zimy i ciepłe lata, a brukowane centrum najbardziej zaprasza w łagodniejszych miesiącach.",
  },
  lodz: {
    en: "Łódź tells the story of Poland's industrial boom, from the grand Piotrkowska Street to repurposed textile mills like Manufaktura. Central and continental in climate, the city is easiest to walk in the warmer, brighter half of the year.",
    pl: "Łódź opowiada historię polskiego boomu przemysłowego — od reprezentacyjnej ulicy Piotrkowskiej po przekształcone fabryki włókiennicze jak Manufaktura. Centralny i kontynentalny klimat sprawia, że miasto najłatwiej zwiedzać w cieplejszej, jaśniejszej połowie roku.",
  },
  olsztyn: {
    en: "Olsztyn is the gateway to the Masurian lake district, with a Teutonic castle and water never far away. Its northern, continental climate brings cold winters and mild summers — the season when the surrounding lakes make the city most appealing.",
    pl: "Olsztyn to brama do Krainy Wielkich Jezior Mazurskich, z krzyżackim zamkiem i wodą zawsze w pobliżu. Północny, kontynentalny klimat daje mroźne zimy i łagodne lata — to pora, w której okoliczne jeziora czynią miasto najbardziej pociągającym.",
  },
  opole: {
    en: "A Silesian city on the Oder, Opole is best known across Poland for its national song festival and a tidy riverside old town. The temperate continental climate favours late spring through early autumn for time along the water.",
    pl: "Śląskie miasto nad Odrą, Opole znane jest w całej Polsce z krajowego festiwalu piosenki i zadbanej, nadrzecznej starówki. Umiarkowany, kontynentalny klimat sprzyja pobytowi nad wodą od późnej wiosny po wczesną jesień.",
  },
  poznan: {
    en: "A trade and student city between Berlin and Warsaw, Poznań centres on a colourful Old Market Square famous for the mechanical goats that butt heads at noon. Continental in climate, it's at its liveliest and most walkable from late spring through early autumn.",
    pl: "Handlowe i studenckie miasto między Berlinem a Warszawą, Poznań skupia się wokół barwnego Starego Rynku, słynnego z trykających się w południe koziołków. Kontynentalny klimat sprawia, że jest najżywszy i najbardziej spacerowy od późnej wiosny po wczesną jesień.",
  },
  radom: {
    en: "Radom is a city in central Poland with an industrial heritage and a long-running air show in its calendar. Its temperate continental climate follows the regional rhythm of cold winters and warm summers, with the milder months easiest for visiting.",
    pl: "Radom to miasto w centralnej Polsce z przemysłowym dziedzictwem i cyklicznymi pokazami lotniczymi w kalendarzu. Umiarkowany, kontynentalny klimat trzyma się regionalnego rytmu mroźnych zim i ciepłych lat, a łagodniejsze miesiące najłatwiej sprzyjają wizycie.",
  },
  rybnik: {
    en: "Rybnik lies in the Upper Silesian region of southern Poland, a city with coal-mining roots and a nearby reservoir popular in summer. The continental climate makes late spring to early autumn the most comfortable time to explore.",
    pl: "Rybnik leży w regionie Górnego Śląska na południu Polski — miasto o górniczych korzeniach, z pobliskim zalewem popularnym latem. Kontynentalny klimat sprawia, że najwygodniejszą porą na zwiedzanie jest okres od późnej wiosny po wczesną jesień.",
  },
  rzeszow: {
    en: "The main city of south-eastern Poland, Rzeszów is a gateway to the Subcarpathian region and the Bieszczady mountains beyond. Its continental climate brings cold winters and warm summers, with the surrounding landscapes best reached in the warmer season.",
    pl: "Główne miasto południowo-wschodniej Polski, Rzeszów jest bramą na Podkarpacie i dalej w Bieszczady. Kontynentalny klimat daje mroźne zimy i ciepłe lata, a okoliczne krajobrazy najlepiej zwiedzać w cieplejszej porze.",
  },
  szczecin: {
    en: "Szczecin, in Poland's north-west near the German border, is a port on the Oder with broad, Paris-inspired avenues and green surroundings. Its maritime-influenced climate is milder and damper than inland Poland, with summer the easiest season for the waterways.",
    pl: "Szczecin na północnym zachodzie Polski, blisko granicy z Niemcami, to port nad Odrą z szerokimi, paryskimi alejami i zielonym otoczeniem. Klimat z wpływem morza jest łagodniejszy i wilgotniejszy niż w głębi kraju, a lato najłatwiej sprzyja zwiedzaniu dróg wodnych.",
  },
  warsaw: {
    en: "Warsaw is a city of contrasts — a meticulously rebuilt Old Town beside broad postwar avenues and glassy towers. Its inland, continental climate brings cold winters and warm, changeable summers, so May to September is the comfortable window, with long daylight for the Vistula boulevards and the parks around Łazienki.",
    pl: "Warszawa to miasto kontrastów — skrupulatnie odbudowana Starówka obok szerokich powojennych alej i szklanych wieżowców. Kontynentalny klimat oznacza mroźne zimy i ciepłe, zmienne lata, dlatego od maja do września jest najwygodniej, z długim dniem na spacery bulwarami nad Wisłą i po Łazienkach.",
  },
  wroclaw: {
    en: "Wrocław spreads across islands and bridges on the Oder, with a colourful Market Square and tiny bronze dwarves hidden around the centre. Its temperate climate and waterside setting make late spring through early autumn the most rewarding time to wander.",
    pl: "Wrocław rozłożył się na wyspach i mostach nad Odrą, z barwnym Rynkiem i maleńkimi krasnalami z brązu ukrytymi po centrum. Umiarkowany klimat i nadwodne położenie sprawiają, że najprzyjemniej spaceruje się tu od późnej wiosny po wczesną jesień.",
  },
  zabrze: {
    en: "Zabrze sits in the Upper Silesian conurbation and is known for its mining heritage, including a historic coal mine now open to visitors. The continental climate makes the warmer months the most comfortable for getting around the city.",
    pl: "Zabrze leży w aglomeracji górnośląskiej i znane jest z górniczego dziedzictwa, w tym zabytkowej kopalni węgla otwartej dla zwiedzających. Kontynentalny klimat sprawia, że cieplejsze miesiące są najwygodniejsze do poruszania się po mieście.",
  },
  "zielona-gora": {
    en: "Unusually for Poland, Zielona Góra lies in a wine-growing area in the west of the country and celebrates it with an autumn grape harvest festival. The temperate climate is at its kindest from late spring through the harvest season.",
    pl: "Nietypowo jak na Polskę, Zielona Góra leży w winiarskim regionie na zachodzie kraju i świętuje to jesiennym winobraniem. Umiarkowany klimat jest najłaskawszy od późnej wiosny po porę zbiorów.",
  },

  // ── Spain ──────────────────────────────────────────────────────────────
  barcelona: {
    en: "Barcelona rewards walkers: the medieval Gothic Quarter, Gaudí's Modernisme along Passeig de Gràcia, and the seafront all sit close enough to string together on foot. Its Mediterranean climate keeps winters mild and summers hot and humid, so the shoulder months trade peak-season queues at the Sagrada Família for far more comfortable sightseeing weather.",
    pl: "Barcelona nagradza spacerowiczów: średniowieczna Dzielnica Gotycka, modernizm Gaudíego wzdłuż Passeig de Gràcia i nadmorska promenada leżą na tyle blisko, że można połączyć je w jeden pieszy dzień. Śródziemnomorski klimat daje łagodne zimy oraz upalne, wilgotne lato, dlatego miesiące przejściowe oznaczają mniej kolejek pod Sagrada Família i znacznie wygodniejszą pogodę na zwiedzanie.",
  },
  ceuta: {
    en: "Ceuta is a Spanish enclave on the North African coast, perched by the Strait of Gibraltar where the Mediterranean meets the Atlantic. Its mild, dry-summer Mediterranean climate makes spring and autumn especially pleasant for the seafront and ramparts.",
    pl: "Ceuta to hiszpańska enklawa na wybrzeżu Afryki Północnej, przy Cieśninie Gibraltarskiej, gdzie Morze Śródziemne spotyka się z Atlantykiem. Łagodny, śródziemnomorski klimat z suchym latem sprawia, że wiosna i jesień są szczególnie przyjemne na nabrzeżu i murach.",
  },
  "las-palmas-de-gran-canaria": {
    en: "On Gran Canaria in the Atlantic, Las Palmas is famous for the long city beach of Las Canteras and a subtropical climate that stays mild all year. With little seasonal swing, it's a rare destination that's comfortable in any month.",
    pl: "Na Gran Canarii na Atlantyku Las Palmas słynie z długiej miejskiej plaży Las Canteras i subtropikalnego klimatu, który przez cały rok pozostaje łagodny. Przy niewielkich wahaniach pór roku to rzadki kierunek wygodny w każdym miesiącu.",
  },
  logrono: {
    en: "Capital of La Rioja, Logroño is Spain's wine country in city form, celebrated for the tapas bars of Calle Laurel and a spot on the Camino de Santiago. Its climate is milder and a touch wetter than the Spanish interior, with autumn harvest season a highlight.",
    pl: "Stolica La Rioja, Logroño to hiszpański kraj wina w miejskiej formie, słynący z barów tapas przy Calle Laurel i położenia na Camino de Santiago. Klimat jest łagodniejszy i nieco wilgotniejszy niż w głębi Hiszpanii, a jesienne winobranie to prawdziwa atrakcja.",
  },
  madrid: {
    en: "Spain's capital sits high on the central plateau, a city of grand plazas, the Prado, and the green sweep of Retiro park. The altitude gives hot, dry summers and crisp, cold winters, making spring and autumn the sweet spot for its outdoor café life.",
    pl: "Stolica Hiszpanii leży wysoko na centralnym płaskowyżu — miasto okazałych placów, muzeum Prado i zielonego parku Retiro. Wysokość daje upalne, suche lata i rześkie, chłodne zimy, dlatego wiosna i jesień najlepiej pasują do życia w ogródkach kawiarni.",
  },
  melilla: {
    en: "Melilla is a Spanish enclave on the North African coast, notable for one of the largest concentrations of Modernist architecture outside Barcelona. Its Mediterranean climate is mild year-round, with spring and autumn the most comfortable for wandering.",
    pl: "Melilla to hiszpańska enklawa na wybrzeżu Afryki Północnej, wyróżniająca się jednym z największych skupisk architektury modernistycznej poza Barceloną. Śródziemnomorski klimat jest łagodny przez cały rok, a wiosna i jesień najwygodniejsze do spacerów.",
  },
  merida: {
    en: "Mérida, in Extremadura, holds some of the finest Roman ruins in Spain — a theatre, an amphitheatre and a long aqueduct still standing. Set inland with hot, dry summers, it's most comfortable to explore in spring and autumn.",
    pl: "Mérida w Estremadurze kryje jedne z najwspanialszych rzymskich ruin w Hiszpanii — teatr, amfiteatr i wciąż stojący długi akwedukt. Położona w głębi lądu, z upalnym, suchym latem, jest najwygodniejsza do zwiedzania wiosną i jesienią.",
  },
  murcia: {
    en: "Murcia, in Spain's south-east, is a relaxed city of Baroque architecture surrounded by the fertile market gardens of its huerta, with the coast close by. Its hot, dry climate makes spring and autumn the most agreeable times to visit.",
    pl: "Murcia na południowym wschodzie Hiszpanii to spokojne miasto barokowej architektury otoczone żyznymi ogrodami huerty, z wybrzeżem w pobliżu. Gorący, suchy klimat sprawia, że najprzyjemniej odwiedzać ją wiosną i jesienią.",
  },
  palma: {
    en: "Palma, on Mallorca, gathers around a vast seafront cathedral and a Mediterranean old town, with beaches and the Tramuntana mountains close by. Summers are hot and busy; spring and autumn offer warm sea air with far smaller crowds.",
    pl: "Palma na Majorce skupia się wokół ogromnej nadmorskiej katedry i śródziemnomorskiej starówki, z plażami i górami Tramuntana w pobliżu. Lato bywa upalne i zatłoczone; wiosna i jesień dają ciepłe morskie powietrze przy znacznie mniejszych tłumach.",
  },
  pamplona: {
    en: "Capital of Navarre, Pamplona is known worldwide for the San Fermín festival and its running of the bulls, but keeps a handsome old town year-round. In the greener, wetter north near the Pyrenees, its summers are warm and its winters cool.",
    pl: "Stolica Nawarry, Pampeluna znana jest na świecie z fiesty San Fermín i gonitwy byków, lecz przez cały rok zachowuje urokliwą starówkę. W zieleńszej, wilgotniejszej północy blisko Pirenejów lata są ciepłe, a zimy chłodne.",
  },
  "santa-cruz-de-tenerife": {
    en: "On Tenerife in the Atlantic, Santa Cruz is known for its flamboyant Carnival and sits under the volcanic bulk of Mount Teide. Its subtropical climate stays mild all year, with only gentle seasonal change.",
    pl: "Na Teneryfie na Atlantyku Santa Cruz słynie z barwnego karnawału i leży u stóp wulkanicznego masywu Teide. Subtropikalny klimat pozostaje łagodny przez cały rok, z jedynie delikatną zmianą pór.",
  },
  "santiago-de-compostela": {
    en: "The end point of the Camino, Santiago de Compostela is a granite city of arcaded lanes built around its great cathedral, in green, Atlantic Galicia. It is one of Spain's rainiest cities, so summer offers the most reliable window between the showers.",
    pl: "Cel Camino, Santiago de Compostela to granitowe miasto podcieni wzniesione wokół wielkiej katedry, w zielonej, atlantyckiej Galicji. To jedno z najbardziej deszczowych miast Hiszpanii, więc lato daje najpewniejsze okno pomiędzy opadami.",
  },
  sevilla: {
    en: "Andalusia's capital is all warmth and theatre — the Alcázar's gardens, the Giralda, flamenco, and orange trees along the Guadalquivir. Summers here are among Europe's hottest, so spring and autumn are by far the most comfortable times to visit.",
    pl: "Stolica Andaluzji to czyste ciepło i teatr — ogrody Alcázaru, Giralda, flamenco i drzewka pomarańczowe nad Gwadalkiwirem. Lata należą tu do najgorętszych w Europie, więc wiosna i jesień są zdecydowanie najwygodniejszymi porami na wizytę.",
  },
  toledo: {
    en: "Perched on a hill in a loop of the Tagus near Madrid, Toledo is a walled medieval maze long known as the 'city of three cultures'. Inland with hot, dry summers, it's most pleasant to climb its lanes in spring and autumn.",
    pl: "Wzniesione na wzgórzu w zakolu Tagu niedaleko Madrytu, Toledo to otoczony murami średniowieczny labirynt, od dawna zwany „miastem trzech kultur”. Położone w głębi lądu, z upalnym, suchym latem, najprzyjemniej wspinać się jego uliczkami wiosną i jesienią.",
  },
  valencia: {
    en: "On the Mediterranean, Valencia balances a historic centre with the futuristic City of Arts and Sciences and the green ribbon of the former Turia riverbed. As the birthplace of paella with a mild coastal climate, it's enjoyable across a long season from spring to autumn.",
    pl: "Nad Morzem Śródziemnym Walencja łączy zabytkowe centrum z futurystycznym Miastem Sztuki i Nauki oraz zieloną wstęgą dawnego koryta rzeki Turia. Jako kolebka paelli, z łagodnym nadmorskim klimatem, cieszy przez długi sezon od wiosny do jesieni.",
  },
  valladolid: {
    en: "A historic city of Castile and once the seat of the Spanish court, Valladolid is known for its sculpture museum and elaborate Holy Week processions. Set inland, it has hot summers and cold winters, with spring and autumn the gentlest seasons.",
    pl: "Historyczne miasto Kastylii i niegdyś siedziba hiszpańskiego dworu, Valladolid słynie z muzeum rzeźby i wystawnych procesji Wielkiego Tygodnia. Położone w głębi lądu, ma upalne lata i mroźne zimy, a wiosna i jesień są najłagodniejszymi porami.",
  },
  zaragoza: {
    en: "Zaragoza sits on the Ebro between Madrid and Barcelona, dominated by the great Basilica del Pilar on the riverbank. Its inland climate brings hot summers, cold winters and the sharp Cierzo wind, leaving spring and autumn as the easiest times to visit.",
    pl: "Saragossa leży nad Ebro między Madrytem a Barceloną, a jej panoramie dominuje wielka bazylika del Pilar nad brzegiem rzeki. Klimat w głębi lądu daje upalne lata, mroźne zimy i ostry wiatr Cierzo, więc wiosna i jesień są najłatwiejszymi porami na wizytę.",
  },

  // ── Morocco ────────────────────────────────────────────────────────────
  "al-hoceima": {
    en: "Al Hoceïma sits on Morocco's Rif coast, a Mediterranean town of coves and beaches backed by steep mountains. Its mild coastal climate makes the warm season the natural time for the seafront, while the rugged hinterland stays a striking backdrop year-round.",
    pl: "Al Hoceïma leży na marokańskim wybrzeżu Rif — śródziemnomorskie miasto zatoczek i plaż z tłem stromych gór. Łagodny, nadmorski klimat czyni ciepłą porę naturalnym czasem na nabrzeże, a surowe zaplecze pozostaje efektownym tłem przez cały rok.",
  },
  casablanca: {
    en: "Morocco's largest city and economic engine, Casablanca faces the Atlantic with art-deco boulevards and the vast, ocean-side Hassan II Mosque. The coastal climate is mild and rarely extreme, comfortable for the corniche across much of the year.",
    pl: "Największe miasto Maroka i jego gospodarczy motor, Casablanca zwraca się ku Atlantykowi alejami w stylu art déco i ogromnym, nadoceanicznym meczetem Hassana II. Nadmorski klimat jest łagodny i rzadko skrajny, wygodny do spacerów po corniche przez większość roku.",
  },
  fes: {
    en: "Fes is Morocco's spiritual and cultural heart, home to one of the world's largest car-free medieval medinas, a maze of souks, madrasas and tanneries. Set inland, it has hot summers and cooler winters, with spring and autumn the most comfortable for the labyrinth.",
    pl: "Fez to duchowe i kulturalne serce Maroka, z jedną z największych na świecie średniowiecznych medin wolnych od samochodów — labiryntem souków, medres i garbarni. Położony w głębi lądu, ma upalne lata i chłodniejsze zimy, a wiosna i jesień najwygodniejsze do błądzenia po jego uliczkach.",
  },
  guelmim: {
    en: "Known as a gateway to the Sahara, Guelmim lies in southern Morocco where the plains give way to the desert and is long associated with caravan trade. Its hot, arid climate makes the cooler months the most practical time to pass through.",
    pl: "Znane jako brama na Saharę, Guelmim leży na południu Maroka, tam gdzie równiny ustępują pustyni, i od dawna kojarzone jest z handlem karawanowym. Gorący, suchy klimat sprawia, że chłodniejsze miesiące są najpraktyczniejszą porą na odwiedziny.",
  },
  kenitra: {
    en: "Kenitra is a port city on Morocco's Atlantic coast, set on the Sebou river north of Rabat. Its mild, coastal climate follows the gentle Atlantic pattern, most pleasant outside the peak heat of high summer.",
    pl: "Kenitra to miasto portowe na atlantyckim wybrzeżu Maroka, nad rzeką Sebou na północ od Rabatu. Łagodny, nadmorski klimat trzyma się spokojnego atlantyckiego wzorca, najprzyjemniejszego poza szczytem letniego upału.",
  },
  marrakesh: {
    en: "Marrakesh is a feast for the senses — the swirling Jemaa el-Fnaa square, labyrinthine souks, and gardens — with the snow-capped Atlas Mountains on the horizon. Its semi-arid climate brings very hot summers, so spring and autumn are the prime times to visit.",
    pl: "Marrakesz to uczta dla zmysłów — wirujący plac Jemaa el-Fnaa, labirynt souków i ogrody — z ośnieżonymi szczytami Atlasu na horyzoncie. Półpustynny klimat daje bardzo upalne lata, więc wiosna i jesień to najlepsze pory na wizytę.",
  },
  meknes: {
    en: "One of Morocco's imperial cities, Meknes is known for its monumental gates and walls and sits near the Roman ruins of Volubilis. Inland with hot summers and mild winters, it's most comfortable to explore in spring and autumn.",
    pl: "Jedno z marokańskich miast cesarskich, Meknes słynie z monumentalnych bram i murów, a w pobliżu leżą rzymskie ruiny Volubilis. Położone w głębi lądu, z upalnym latem i łagodną zimą, jest najwygodniejsze do zwiedzania wiosną i jesienią.",
  },
  ouarzazate: {
    en: "Often called the gateway to the desert, Ouarzazate lies south of the Atlas Mountains amid kasbahs and film studios that have stood in for many on-screen deserts. Its arid climate brings hot days, cool nights and big seasonal swings, with spring and autumn the easiest.",
    pl: "Często zwane bramą pustyni, Ouarzazate leży na południe od gór Atlas, pośród kasb i studiów filmowych, które na ekranie udawały niejedną pustynię. Suchy klimat daje upalne dni, chłodne noce i duże wahania pór roku, a wiosna i jesień są najłatwiejsze.",
  },
  oujda: {
    en: "Oujda sits in Morocco's far north-east, close to the Algerian border, a long-standing crossroads town between the Mediterranean and the interior. Its semi-arid climate makes the milder months the most agreeable time to visit.",
    pl: "Oujda leży na dalekim północnym wschodzie Maroka, blisko granicy z Algierią — od dawna miasto-skrzyżowanie między Morzem Śródziemnym a wnętrzem kraju. Półpustynny klimat sprawia, że łagodniejsze miesiące są najprzyjemniejszą porą na odwiedziny.",
  },
  safi: {
    en: "Safi is an Atlantic port in Morocco with a long pottery tradition and a working fishing harbour. Its mild coastal climate keeps temperatures even through the year, most pleasant outside the height of summer.",
    pl: "Safi to atlantycki port w Maroku z długą tradycją garncarską i czynnym portem rybackim. Łagodny, nadmorski klimat utrzymuje wyrównane temperatury przez cały rok, najprzyjemniejsze poza szczytem lata.",
  },
  settat: {
    en: "Settat is a town on the agricultural plains inland from Casablanca, in west-central Morocco. Its semi-arid climate runs hot in summer and mild in winter, with the cooler months the most comfortable for a visit.",
    pl: "Settat to miasto na rolniczych równinach w głębi lądu od strony Casablanki, w środkowo-zachodnim Maroku. Półpustynny klimat bywa upalny latem i łagodny zimą, a chłodniejsze miesiące są najwygodniejsze na wizytę.",
  },
  "tan-tan": {
    en: "Tan-Tan lies in Morocco's deep south, near both the Atlantic and the edge of the Sahara, and is associated with a long-running nomad gathering. Its hot, arid climate makes the cooler months the most practical time to pass through.",
    pl: "Tan-Tan leży na dalekim południu Maroka, blisko zarówno Atlantyku, jak i skraju Sahary, i kojarzone jest z cyklicznym zlotem nomadów. Gorący, suchy klimat sprawia, że chłodniejsze miesiące są najpraktyczniejszą porą na odwiedziny.",
  },
  tangier: {
    en: "Tangier guards the northern tip of Morocco at the Strait of Gibraltar, where the Mediterranean meets the Atlantic, a port city with a storied international past. Its mild coastal climate makes spring and autumn especially pleasant for the medina and seafront.",
    pl: "Tanger strzeże północnego krańca Maroka przy Cieśninie Gibraltarskiej, gdzie Morze Śródziemne spotyka się z Atlantykiem — miasto portowe o barwnej, międzynarodowej przeszłości. Łagodny, nadmorski klimat sprawia, że wiosna i jesień są szczególnie przyjemne na medinę i nabrzeże.",
  },
  taza: {
    en: "Taza sits in northern Morocco in the gap between the Rif and the Middle Atlas, a historic mountain-pass town with caves and national parkland nearby. Its inland climate brings hot summers and cooler winters, with spring and autumn the gentlest seasons.",
    pl: "Taza leży na północy Maroka, w przełęczy między Rifem a Średnim Atlasem — historyczne miasto przełęczy z jaskiniami i parkiem narodowym w pobliżu. Klimat w głębi lądu daje upalne lata i chłodniejsze zimy, a wiosna i jesień są najłagodniejszymi porami.",
  },
};

export function getCityEditorial(
  citySlug: string,
  locale: LocaleCode,
): string | undefined {
  const entry = cityEditorial[citySlug];
  return entry?.[locale] ?? entry?.en;
}
