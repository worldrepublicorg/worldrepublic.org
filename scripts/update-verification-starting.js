#!/usr/bin/env node

/**
 * Script to update verification keys in all dictionary files.
 * Updates text with new translations for "starting soon".
 */

const fs = require('fs');
const path = require('path');

const dictionariesDir = path.join(__dirname, '..', 'app', '[lang]', 'dictionaries');
const files = fs.readdirSync(dictionariesDir).filter(file => file.endsWith('.json'));

const translations = {
  af: { d: "Toetsverkiesings begin binnekort. Toets identiteitsverifikasie nou om gereed te wees wanneer stemming oopmaak.", b: "Toets" },
  am: { d: "የሙከራ ምርጫዎች በቅርቡ ይጀምራሉ። ድምጽ መስጠት ሲጀምር ዝግጁ ለመሆን የማንነት ማረጋገጫን አሁን ይሞክሩ።", b: "ሙከራ" },
  ar: { d: "ستبدأ الاختبارات الانتخابية قريباً. اختبر التحقق من الهوية الآن لتكون جاهزاً عند فتح التصويت.", b: "اختبار" },
  az: { d: "Sınaq seçkiləri tezliklə başlayır. Səsvermə başlayanda hazır olmaq üçün indi şəxsiyyətin təsdiqini sınayın.", b: "Sınaq" },
  bg: { d: "Скоро започват тестови избори. Тествайте потвърждаването на самоличността сега, за да сте готови, когато гласуването започне.", b: "Тест" },
  bn: { d: "পরীক্ষামূলক নির্বাচন শীঘ্রই শুরু হচ্ছে। ভোটদান শুরু হলে প্রস্তুত থাকতে এখনই পরিচয় যাচাইকরণ পরীক্ষা করুন।", b: "পরীক্ষা" },
  bs: { d: "Testni izbori počinju uskoro. Testirajte verifikaciju identiteta sada da budete spremni kada glasanje počne.", b: "Test" },
  co: { d: "L'elezzioni di prova cumincianu prestu. Pruvate a verificazione di l'identità avà per esse pronti quandu u votu apre.", b: "Prouva" },
  cs: { d: "Testovací volby začínají brzy. Otestujte ověření totožnosti nyní, abyste byli připraveni, až se otevře hlasování.", b: "Test" },
  de: { d: "Testwahlen beginnen in Kürze. Testen Sie jetzt die Identitätsprüfung, um bereit zu sein, wenn die Abstimmung beginnt.", b: "Testen" },
  el: { d: "Οι δοκιμαστικές εκλογές ξεκινούν σύντομα. Δοκιμάστε την επαλήθευση ταυτότητας τώρα για να είστε έτοιμοι όταν ανοίξει η ψηφοφορία.", b: "Δοκιμή" },
  es: { d: "Las elecciones de prueba comenzarán pronto. Pruebe la verificación de identidad ahora para estar listo cuando se abra la votación.", b: "Prueba" },
  fa: { d: "انتخابات آزمایشی به زودی آغاز می‌شود. همین حالا تأیید هویت را آزمایش کنید تا هنگام باز شدن رأی‌گیری آماده باشید.", b: "آزمایش" },
  fi: { d: "Testivaalit alkavat pian. Testaa henkilöllisyyden varmennus nyt ollaksesi valmis, kun äänestys alkaa.", b: "Testaa" },
  fr: { d: "Les élections test commencent bientôt. Testez la vérification d'identité maintenant pour être prêt lors de l'ouverture du vote.", b: "Test" },
  gu: { d: "પરીક્ષણ ચૂંટણીઓ ટૂંક સમયમાં શરૂ થઈ રહી છે. મતદાન શરૂ થાય ત્યારે તૈયાર રહેવા માટે અત્યારે ઓળખ ચકાસણીનું પરીક્ષણ કરો।", b: "પરીક્ષણ" },
  ha: { d: "Zaben gwaji yana farawa nan ba da jimawa ba. Gwada tabbatar da asali yanzu don kasancewa cikin shiri lokacin da aka bude kada kuri'a.", b: "Gwaji" },
  hi: { d: "परीक्षण चुनाव जल्द ही शुरू हो रहे हैं। मतदान शुरू होने पर तैयार रहने के लिए अभी पहचान सत्यापन का परीक्षण करें।", b: "परीक्षण" },
  hu: { d: "Hamarosan kezdődnek a tesztválasztások. Tesztelje a személyazonosság-ellenőrzést most, hogy készen álljon a szavazás kezdetekor.", b: "Teszt" },
  hy: { d: "Թեստային ընտրությունները շուտով սկսվում են։ Փորձարկեք ինքնության ստուգումը հիմա, որպեսզի պատրաստ լինեք քվեարկության բացմանը։", b: "Թեստ" },
  id: { d: "Pemilihan uji coba akan segera dimulai. Uji verifikasi identitas sekarang agar siap saat pemungutan suara dibuka.", b: "Uji" },
  it: { d: "Le elezioni di prova inizieranno presto. Testa la verifica dell'identità ora per essere pronto all'apertura del voto.", b: "Test" },
  ja: { d: "テスト選挙がまもなく開始されます。投票開始時に準備ができるよう、今すぐ本人確認をテストしてください。", b: "テスト" },
  km: { d: "ការបោះឆ្នោតសាកល្បងនឹងចាប់ផ្តើមក្នុងពេលឆាប់ៗនេះ។ សាកល្បងការផ្ទៀងផ្ទាត់អត្តសញ្ញាណឥឡូវនេះ ដើម្បីត្រៀមខ្លួននៅពេលការបោះឆ្នោតចាប់ផ្តើម។", b: "សាកល្បង" },
  ko: { d: "테스트 선거가 곧 시작됩니다. 투표가 시작될 때 준비될 수 있도록 지금 본인 확인을 테스트하세요.", b: "테스트" },
  lt: { d: "Bandomieji rinkimai prasideda netrukus. Išbandykite tapatybės patvirtinimą dabar, kad būtumėte pasiruošę, kai prasidės balsavimas.", b: "Testas" },
  lv: { d: "Testa vēlēšanas sāksies drīz. Testējiet identitātes pārbaudi tagad, lai būtu gatavi, kad sāksies balsošana.", b: "Tests" },
  ms: { d: "Pilihan raya ujian akan bermula tidak lama lagi. Uji pengesahan identiti sekarang untuk bersedia apabila pengundian dibuka.", b: "Uji" },
  my: { d: "စမ်းသပ်ရွေးကောက်ပွဲများ မကြာမီစတင်တော့မည်။ မဲပေးမှုစတင်ချိန်တွင် အဆင်သင့်ဖြစ်စေရန် ယခုပင် အထောက်အထားအတည်ပြုခြင်းကို စမ်းသပ်ပါ။", b: "စမ်းသပ်" },
  nl: { d: "Testverkiezingen beginnen binnenkort. Test identiteitsverificatie nu om klaar te zijn wanneer het stemmen begint.", b: "Test" },
  pl: { d: "Wybory testowe rozpoczynają się wkrótce. Przetestuj weryfikację tożsamości teraz, aby być gotowym, gdy rozpocznie się głosowanie.", b: "Test" },
  ps: { d: "آزمایښتي ټاکنې ژر پیلیږي. د هویت تایید اوس و ازموئ ترڅو د رایې ورکولو پرمهال چمتو اوسئ.", b: "ازموینه" },
  pt: { d: "As eleições de teste começarão em breve. Teste a verificação de identidade agora para estar pronto quando a votação abrir.", b: "Teste" },
  ro: { d: "Alegerile de test încep în curând. Testați verificarea identității acum pentru a fi pregătiți când se deschide votul.", b: "Test" },
  ru: { d: "Скоро начнутся тестовые выборы. Протестируйте подтверждение личности сейчас, чтобы быть готовым к началу голосования.", b: "Тест" },
  rw: { d: "Amatora y'igerageza ari gutangira vuba. Gerageza igenzura ry'umwirondoro ubu kugira ngo ube witeguye igihe amatora azatangira.", b: "Gerageza" },
  sk: { d: "Testovacie voľby začínajú čoskoro. Otestujte overenie totožnosti teraz, aby ste boli pripravení, keď sa otvorí hlasovanie.", b: "Test" },
  sl: { d: "Testne volitve se začnejo kmalu. Testirajte preverjanje identitete zdaj, da boste pripravljeni, ko se odpre glasovanje.", b: "Test" },
  so: { d: "Doorashooyinka tijaabada ah ayaa bilaabanaya dhowaan. Tijaabi xaqiijinta aqoonsiga hadda si aad diya u noqoto marka codeyntu furmo.", b: "Tijaabi" },
  sr: { d: "Тест избори почињу ускоро. Тестирајте верификацију идентитета сада да бисте били спремни када гласање почне.", b: "Тест" },
  sw: { d: "Uchaguzi wa majaribio unaanza hivi karibuni. Jaribu uthibitishaji wa kitambulisho sasa ili uwe tayari wakati upigaji kura utakapofunguliwa.", b: "Jaribu" },
  th: { d: "การเลือกตั้งทดสอบกำลังจะเริ่มขึ้นในเร็วๆ นี้ ทดสอบการยืนยันตัวตนตอนนี้เพื่อเตรียมพร้อมเมื่อเปิดให้ลงคะแนน", b: "ทดสอบ" },
  tl: { d: "Magsisimula na ang mga pagsubok na halalan. Subukan ang pagpapatunay ng pagkakakilanlan ngayon upang maging handa kapag nagbukas ang botohan.", b: "Subukan" },
  tr: { d: "Deneme seçimleri yakında başlıyor. Oylama başladığında hazır olmak için kimlik doğrulamasını şimdi test edin.", b: "Test" },
  uk: { d: "Скоро розпочнуться тестові вибори. Протестуйте перевірку особи зараз, щоб бути готовим, коли відкриється голосування.", b: "Тест" },
  ur: { d: "ٹیسٹ انتخابات جلد شروع ہو رہے ہیں۔ ووٹنگ کھلنے پر تیار رہنے کے لیے ابھی شناخت کی تصدیق کا ٹیسٹ کریں۔", b: "ٹیسٹ" },
  uz: { d: "Sinov saylovlari tez orada boshlanadi. Ovoz berish boshlanganda tayyor bo'lish uchun shaxsni tasdiqlashni hozir sinab ko'ring.", b: "Sinov" },
  vi: { d: "Cuộc bầu cử thử nghiệm sắp bắt đầu. Hãy thử nghiệm xác minh danh tính ngay bây giờ để sẵn sàng khi cuộc bỏ phiếu mở ra.", b: "Kiểm tra" },
  yo: { d: "Awọn idibo idanwo bẹrẹ laipẹ. Ṣe idanwo ijẹrisi idanimọ ni bayi lati ṣetan nigbati ibo ba ṣii.", b: "Idanwo" },
  zh: { d: "测试选举即将开始。立即测试身份验证，以便在投票开始时做好准备。", b: "测试" }
};

const defaultEn = {
  d: "Test elections are starting soon. Test identity verification now to be ready when voting opens.",
  b: "Test"
};

console.log(`Found ${files.length} dictionary files to process...\n`);

let processed = 0;
let errors = 0;

files.forEach(file => {
  if (file === 'en.json') {
    console.log('Skipping en.json (already updated)');
    return;
  }

  const filePath = path.join(dictionariesDir, file);
  const langCode = file.replace('.json', '');
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Access nested path: pages.govern.vote
    if (data.pages?.govern?.vote?.test_verification) {
      const trans = translations[langCode] || defaultEn;
      
      data.pages.govern.vote.test_verification = {
        description: trans.d,
        test_button: trans.b
      };
      
      // Write back
      const updatedContent = JSON.stringify(data, null, 2) + '\n';
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      
      processed++;
      console.log(`✓ Updated ${file}`);
    } else {
      console.log(`⚠ Skipped ${file} (structure not found)`);
    }
  } catch (error) {
    errors++;
    console.error(`✗ Error processing ${file}:`, error.message);
  }
});

console.log(`\nCompleted: ${processed} files processed, ${errors} errors`);

