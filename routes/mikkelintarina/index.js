/*jshint esversion: 6 */
/* global __dirname */

(() => {
  'use strict';

  const storyValuesLookUp = {
    "ingres": {
      "question": "minka-moton-valitset",
      "values": {
        "kylla-se-siita": "<h2>Olet yltiöpäinen ylämäkihiihtäjä. Elämä voi olla joskus haasteellista, mutta kaikesta on selvitty.</h2>",
        "jaksaa-jaksaa": "<h2>Olet vallaton vesihiihtäjä. Isot pärskeet ja taidokkaat kuviot ovat sinun juttusi.</h2>",
        "ookoo": "<h2>Olet selvästi alamäkihiihtäjä. Painovoima tuo alaspäin, ja viisas hyödyntää sen. Menossasi on vauhdin hurmaa ja otat aina haasteet vastaan.</h2>",
        "saha": "<h2>Olet vapaan tyylin taitaja. Sinulla on kaikki tyylit hallussa. Odotat vain seuraavaa uutta juttua, jota pääsisit kokeilemaan.</h2>",
        "hyvatulee": "<h2>Olet letkan vetäjä. Näytät mallia muille, miten hommat hoidetaan. Eihän tänne ihmettelemään ole tultu.</h2>",
        "nohittomiksei": "<h2>Olet peloton umpihankihiihtäjä, joka ei tarvitse valmiita latuja ja havuja, vaan haet jatkuvasti uusia reittejä ja näkymiä.</h2>"
      }
    },
    "question-2": {
      "question": "mikkelilainen-on",
      "values": {
        "nautiskelija": "<p>Olet nautiskelija, joka ymmärtää hyvän päälle, mutta haluaa jakaa hyvää muillekin. ",
        "humoristi": "<p>Olet armoitettu humoristi. Ja älykäskin vielä. Tekemisessäsi on aina huumoria ja pikkaisen perkelettä. ",
        "rauhallinen": "<p>Voit näyttää rauhalliselta, mutta todellisuudessa keskität huomiosi vain oikeisiin asioihin. ",
        "puurtaja": "<p>Pidät itseäsi sitkeänä puurtajana, ja sinultahan sujuu mikä vain. Menet eteenpäin varmasti kuin dieselveturi. ",
        "elamysahmatti": "<p>Koet asioita täysillä ja rohmuat uusia kokemuksia. Elämys per päivä pitää lääkärin loitolla. ",
        "vaaraleuka": "<p>Olet huumorin suurlähettiläs. Osaat ottaa ilon irti ja juttu lentää kuin leppäkeihäs. Sinuun jäädään suusta kiinni. ",
        "ajattelija": "<p>Olet ajattelija ja älykkö. Valokuvauksellisen ulkonäkösi ei pidä antaa hämätä. Sisältä olet vieläkin upeampi. ",
        "tekija": "<p>Saatat esittää, ettet tee mitään, mutta jälki puhuu puolestaan. Ja sitähän syntyy. Olet vikkelä kuin talkkari jäisellä peltikatolla. ",
        "rajatapaus": "<p>Olet optimistinen ja rohkea. Haluat aina antaa mahikselle tsäänssin, sillä koskaan ei voi tietää, mitä se tuo tullessaan. "
      }
    },
    "question-4": {
      "question": "olen-luonteeltani",
      "values": {
        "mutkaton": "Et anna mutkien hidastaa kulkua, vaan valitset linnuntien – liitäen yli esteiden, suoraan kohti määränpäätä. ",
        "hinee": "On vaikea olla nöyrä, kun on niin älyttömän hyvä – tämän sinä, jos kuka, tiedät ihan omasta kokemuksesta. ",
        "peloton": "Kiidät rotsi auki kohti hyppyrin nokkaa ja ponnistat kaikin voimin lentoon -– alastulokoordinaatteja tietämättä. ",
        "jaarapainen": "Järkälemäisellä tahdonvoimallasi menet läpi harmaan kiven ja poljet käyntiin vaikka tulpattoman mopon. ",
        "leppoisa": "Leppoisana tyyppinä voit näyttää lutuiselta, mutta olet kuitenkin täysi peto hommiin ryhtyessäsi. ",
        "kesyttamaton": "Lykit eteenpäin kesyttämättömällä eläimen raivolla. Sinua on vaikea saada kiinni edes pisimmällä suorilla. ",
        "puolihullu": "Otat aurinkoa kuutamolla ja pelaat pasianssia vaikka vajaalla pakalla. Svengaat kuin hirvi. "
      }
    },
    "question-6": {
      "question": "jos-ruotsin-kunigas-tulisi-mikkeliin-veisit-hanet-ensimmaisena",
      "values": {
        "torille": "Istuskelet auringossa Mikkelin torilla, ",
        "paamajamuseoon": "Ylpeänä Mikkelin historiasta käyt fiilistelemässä päämajamuseossa, ",
        "naisvuorelle": "Kiipeät Naisvuorelle tiirailemaan kaupunkia lintuperspektiivistä, ",
        "stellaan-chillaamaan": "Seurankipeänä menet Stellaan chillaamaan, ",
        "saimaalle": "Saimaa on sinulle Mikkelin sydän – sydämesi suorastaan sykkii laineiden tahdissa – ",
        "astuvansalmen-kalliomaalauksille": "Kun haluat palata juurillesi, käyt katsomassa esi-isien maalauksia Astuvansalmella, ",
        "ostamaan-tuliaiset-kotivaelle-kenkaverosta": "Kenkäverosta käyt ostamassa kunnon käsityötä, mitä ei tahdo enää saada mistään, ",
        "jurassic-rockiin": "Käyt kuluttamassa kulttuuria kesätapahtumissa, ",
        "jukureiden-matsiin": "Voitonnälkäisenä menet Jukureiden matsiin, ",
        "graanille-prismaan": "Lauantaisin käyt Graanin Prismassa,  "
      }
    },
    "question-3": {
      "question": "mikkelissa-kannattaa-ehdottomasti",
      "values": {
        "jurassic": "ja syöt Jurassic Rokissa festivaalimättöä. ",
        "eeppi": "ja Eepin grillin heimopurilainen on parasta, mitä tiedät. ",
        "satama": "ja satamassa syöt vohveleita. ",
        "torikahvila": "ja torikahvilassa juot munkkikahvit. ",
        "marski": "ja baarissa tilaat Marskin ryypyn – mikäli ikä sallii. ",
        "greeneri": "ja lounaan nautit Greenerissä. ",
        "tertti": "ja päivän brunssilla käyt Tertin kartanossa. ",
        "siiskonen": "ja kotiin ostat Siiskosen kauraleipää. "
      }
    },
    "question-5": {
      "question": "mikkelin-ilmapiiri-on",
      "values": {
        "yhteen-hiileen-puhaltava": "Kaipaat toimintaasi mielummin kunnon roihua kuin hiljaista kytemistä. Puhaltamalla yhteen hiileen saat voimaa myös itsellesi. ",
        "ennakkoluuloton": "Niin huonoa ideaa ei ole olemassakaan, ettetkö saisi jalostettua siitä jotakin ennennäkemätöntä. ",
        "lupsakka": "Lupsakkana tyyppinä olet suorastaan ärsyttävä – ärsyttävän mukava ja hurmaava. ",
        "sahakka": "Hyvä pöhinä on sinun juttusi. Siellä tapahtuu, missä sinä. Jaat energiaa ympärillesi. ",
        "lennokas": "Ajatusmaailmasi on lennokas. Et ole jämähtänyt paikoillesi, vaan mielesi tähyää uteliaana tulevaisuuteen. ",
        "ainutlaatuinen": "Maailmassa on 7 miljardia ihmistä, mutta vain yksi sinä. Olet ainutlaatuinen kuin norppa Saimaalla. ",
        "tolkuton": "Menosi voi näyttää tolkuttomalta, mutta ilman rohkeaa ja hullua ideointia ei synny mitään suurta. "
      }
    },
    "question-8": {
      "question": "minka-moton-valitset",
      "values": {
        "ookoo": "Mottosi mukaan sinulle käy kaikki. Mitä oudompi juttu, sitä innokkaammin olet mukana.</p>",
        "kylla-se-siita": "Mottosi todistaa, että olet luonteeltasi optimisti – uskosi onnistumiseen on vankkumaton kuin eteläsavolainen kallio.</p>",
        "jaksaa-jaksaa": "Mottosi kertoo vastustamattomasta sinnikkyydestä. Et heitä helpolla pyyhettä kehään.</p>",
        "nohittomiksei": "Mottosi kertoo, että osaat panna kaiken peliin, kun tulee tiukka paikka. Huumorilla ja sisulla selviydyt mistä vain.</p>",
        "hyvatulee": "Mottosi on “no hitto miksei” ja olet siinä aivan oikeassa, että kaikkea uutta kannattaa kokeilla. Se voi yllättää.</p>",
        "saha": "Mottosi todistaa, että käyt luovalla kierteellä. Kierroksia löytyy ja oletkin ajatuksiltasi usein edellä muita.</p>"
      }
    }
  };

  module.exports = (app, config, ModulesClass) => {
    
    app.get('/mikkelin-tarina', (req, res) => {
      const q = req.query.q;
      const buffer =  Buffer.from(q, 'base64');
      const formValues = JSON.parse(buffer.toString());
      const storyValuesOrder = ['ingres', 'question-2', 'question-4', 'question-6', 'question-3', 'question-5', 'question-8'];
      const story = [];
      console.log(formValues);
      storyValuesOrder.forEach((storyValue) => {
        const question = storyValuesLookUp[storyValue].question;
        let questionValue = formValues[question];
        if (questionValue) {
          questionValue = questionValue.indexOf('$') > -1 ? questionValue.split('$')[0] : questionValue;
          story.push(storyValuesLookUp[storyValue].values[questionValue]);
        }
      });
      res.render('pages/mikkelin-tarina-result.pug', {
        story: story.join('')
      });
    });
  };
})();