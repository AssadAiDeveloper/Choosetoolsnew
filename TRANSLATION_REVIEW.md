# Translation review

Every new or changed non-English string is listed here for native review.
All non-English entries below are **machine-drafted** and have not been
reviewed by a native speaker. English is the source string; it is shown for
reference only.

Status legend: `new` = key did not exist before, `changed` = existing value was
replaced.

## T2 — Remove PDF Password (protect-pdf)

New keys in the `tool` namespace, used by the password prompt and the
"cannot unlock" error.

| Key | Language | Old | New | Status |
| --- | --- | --- | --- | --- |
| `tool.pdfPassword` | en (source) | — | PDF password | new |
| `tool.pdfPassword` | ar | — | كلمة مرور PDF | new, machine-drafted |
| `tool.pdfPassword` | de | — | PDF-Passwort | new, machine-drafted |
| `tool.pdfPassword` | es | — | Contraseña del PDF | new, machine-drafted |
| `tool.pdfPassword` | fr | — | Mot de passe du PDF | new, machine-drafted |
| `tool.pdfPassword` | hi | — | PDF पासवर्ड | new, machine-drafted |
| `tool.pdfPassword` | id | — | Kata sandi PDF | new, machine-drafted |
| `tool.pdfPassword` | nl | — | PDF-wachtwoord | new, machine-drafted |
| `tool.pdfPassword` | pt | — | Palavra-passe do PDF | new, machine-drafted |
| `tool.pdfPassword` | ru | — | Пароль PDF | new, machine-drafted |
| `tool.pdfPassword` | tr | — | PDF parolası | new, machine-drafted |
| `tool.unlock` | en (source) | — | Unlock PDF | new |
| `tool.unlock` | ar | — | إلغاء قفل PDF | new, machine-drafted |
| `tool.unlock` | de | — | PDF entsperren | new, machine-drafted |
| `tool.unlock` | es | — | Desbloquear PDF | new, machine-drafted |
| `tool.unlock` | fr | — | Déverrouiller le PDF | new, machine-drafted |
| `tool.unlock` | hi | — | PDF अनलॉक करें | new, machine-drafted |
| `tool.unlock` | id | — | Buka kunci PDF | new, machine-drafted |
| `tool.unlock` | nl | — | PDF ontgrendelen | new, machine-drafted |
| `tool.unlock` | pt | — | Desbloquear PDF | new, machine-drafted |
| `tool.unlock` | ru | — | Разблокировать PDF | new, machine-drafted |
| `tool.unlock` | tr | — | PDF kilidini aç | new, machine-drafted |
| `tool.wrongPassword` | en (source) | — | That password did not work. Try again. | new |
| `tool.wrongPassword` | ar | — | كلمة المرور غير صحيحة. حاول مرة أخرى. | new, machine-drafted |
| `tool.wrongPassword` | de | — | Das Passwort war nicht korrekt. Versuchen Sie es erneut. | new, machine-drafted |
| `tool.wrongPassword` | es | — | Esa contraseña no es correcta. Inténtalo de nuevo. | new, machine-drafted |
| `tool.wrongPassword` | fr | — | Ce mot de passe n'est pas correct. Réessayez. | new, machine-drafted |
| `tool.wrongPassword` | hi | — | यह पासवर्ड सही नहीं है। फिर से प्रयास करें। | new, machine-drafted |
| `tool.wrongPassword` | id | — | Kata sandi itu tidak berhasil. Coba lagi. | new, machine-drafted |
| `tool.wrongPassword` | nl | — | Dat wachtwoord klopt niet. Probeer het opnieuw. | new, machine-drafted |
| `tool.wrongPassword` | pt | — | Essa palavra-passe não está correta. Tente novamente. | new, machine-drafted |
| `tool.wrongPassword` | ru | — | Неверный пароль. Попробуйте ещё раз. | new, machine-drafted |
| `tool.wrongPassword` | tr | — | Bu parola işe yaramadı. Tekrar deneyin. | new, machine-drafted |
| `tool.encryptedPdf` | en (source) | — | This file can't be unlocked in the browser. It may use encryption this tool cannot open. | new |
| `tool.encryptedPdf` | ar | — | لا يمكن إلغاء قفل هذا الملف في المتصفح. قد يستخدم تشفيرًا لا تدعمه هذه الأداة. | new, machine-drafted |
| `tool.encryptedPdf` | de | — | Diese Datei kann im Browser nicht entsperrt werden. Möglicherweise verwendet sie eine Verschlüsselung, die dieses Tool nicht öffnen kann. | new, machine-drafted |
| `tool.encryptedPdf` | es | — | Este archivo no se puede desbloquear en el navegador. Puede usar un cifrado que esta herramienta no admite. | new, machine-drafted |
| `tool.encryptedPdf` | fr | — | Ce fichier ne peut pas être déverrouillé dans le navigateur. Il utilise peut-être un chiffrement que cet outil ne prend pas en charge. | new, machine-drafted |
| `tool.encryptedPdf` | hi | — | यह फ़ाइल ब्राउज़र में अनलॉक नहीं हो सकती। इसमें ऐसा एन्क्रिप्शन हो सकता है जिसे यह टूल नहीं खोल सकता। | new, machine-drafted |
| `tool.encryptedPdf` | id | — | Berkas ini tidak dapat dibuka kuncinya di browser. Mungkin berkas ini memakai enkripsi yang tidak didukung alat ini. | new, machine-drafted |
| `tool.encryptedPdf` | nl | — | Dit bestand kan niet in de browser worden ontgrendeld. Het gebruikt mogelijk versleuteling die deze tool niet kan openen. | new, machine-drafted |
| `tool.encryptedPdf` | pt | — | Não é possível desbloquear este ficheiro no navegador. Pode usar uma encriptação que esta ferramenta não consegue abrir. | new, machine-drafted |
| `tool.encryptedPdf` | ru | — | Этот файл нельзя разблокировать в браузере. Возможно, в нём используется шифрование, которое этот инструмент не поддерживает. | new, machine-drafted |
| `tool.encryptedPdf` | tr | — | Bu dosya tarayıcıda açılamıyor. Bu aracın desteklemediği bir şifreleme kullanıyor olabilir. | new, machine-drafted |

## T5 — CV / Resume Builder (cv-builder): remove false ATS claims

The exporter embeds a PNG rendered from a canvas in the PDF (`CvBuilder.tsx`),
so the PDF has no text layer. The old copy claimed ATS software could read it.
The new copy describes the real output and states the limitation. `name` was
changed only where it contained an ATS claim.

| Key | Language | Old | New | Status |
| --- | --- | --- | --- | --- |
| `tools.cv-builder.desc` | en (source) | Build a clean, single-column résumé that applicant tracking systems can read. | Build a clean, single-column résumé with clear headings, ready to print or save as PDF. | changed |
| `tools.cv-builder.long` | en (source) | Fill in your experience, education and skills — the layout is deliberately simple (one column, plain headings, no tables or graphics) because that is exactly what ATS software parses reliably. Long résumés automatically flow onto extra pages. | Fill in your experience, education and skills. The layout is deliberately simple — one column, plain headings, no tables or graphics — so it stays easy to read on screen and on paper, and long résumés automatically flow onto extra pages. The PDF is generated as a high-resolution image, so its text is not selectable. | changed |
| `tools.cv-builder.faq1q` | en (source) | Why does the design look so plain? | Can applicant tracking systems (ATS) read the PDF? | changed |
| `tools.cv-builder.faq1a` | en (source) | Applicant tracking systems used by most employers struggle with multi-column layouts, icons and text boxes. A single-column résumé with clear headings is more likely to be parsed correctly and reach a human reviewer. | No. The PDF is drawn as a high-resolution image so that Arabic and other scripts render correctly, which means its text is not selectable and ATS software cannot parse it. Copy the text from the editor if you need to paste it into an application form. | changed |
| `tools.cv-builder.name` | ar | منشئ السيرة الذاتية (متوافق مع أنظمة ATS) | منشئ السيرة الذاتية | changed, machine-drafted |
| `tools.cv-builder.desc` | ar | أنشئ سيرة ذاتية نظيفة أحادية العمود تقرأها أنظمة الفرز الآلي. | أنشئ سيرة ذاتية نظيفة أحادية العمود بعناوين واضحة، جاهزة للطباعة أو الحفظ بصيغة PDF. | changed, machine-drafted |
| `tools.cv-builder.long` | ar | أدخل خبراتك وتعليمك ومهاراتك — التصميم مبسّط عمداً (عمود واحد، عناوين واضحة، بلا جداول أو رسومات) لأن هذا بالضبط ما تحلّله برامج ATS بموثوقية. السير الطويلة تنتقل تلقائياً لصفحات إضافية. | أدخل خبراتك وتعليمك ومهاراتك. التصميم مبسّط عمداً — عمود واحد، عناوين واضحة، بلا جداول أو رسومات — ليبقى سهل القراءة على الشاشة والورق، والسير الطويلة تنتقل تلقائياً إلى صفحات إضافية. يُولَّد ملف PDF كصورة عالية الدقة، لذا لا يمكن تحديد نصه. | changed, machine-drafted |
| `tools.cv-builder.faq1q` | ar | لماذا التصميم بسيط هكذا؟ | هل تستطيع أنظمة تتبع المتقدمين (ATS) قراءة ملف PDF؟ | changed, machine-drafted |
| `tools.cv-builder.faq1a` | ar | أنظمة الفرز الآلي التي تستخدمها معظم الشركات تواجه صعوبة مع التصاميم متعددة الأعمدة والأيقونات والمربعات النصية. السيرة أحادية العمود بعناوين واضحة أكثر احتمالاً أن تُحلَّل بشكل صحيح وتصل لمراجع بشري. | لا. يُرسم ملف PDF كصورة عالية الدقة حتى تظهر العربية وغيرها من الكتابات بشكل صحيح، وهذا يعني أن نصه غير قابل للتحديد ولا تستطيع برامج ATS تحليله. انسخ النص من المحرر إذا كنت بحاجة إلى لصقه في نموذج تقديم. | changed, machine-drafted |
| `tools.cv-builder.desc` | de | Einen sauberen, einspaltigen Lebenslauf erstellen, den Bewerbertracking-Systeme lesen können. | Einen sauberen, einspaltigen Lebenslauf mit klaren Überschriften erstellen, bereit zum Drucken oder Speichern als PDF. | changed, machine-drafted |
| `tools.cv-builder.long` | de | Füllen Sie Ihre Berufserfahrung, Ausbildung und Fähigkeiten aus — das Layout ist bewusst schlicht (eine Spalte, klare Überschriften, keine Tabellen oder Grafiken), weil genau das ATS-Software zuverlässig parsen kann. Lange Lebensläufe laufen automatisch auf zusätzliche Seiten über. | Füllen Sie Ihre Berufserfahrung, Ausbildung und Fähigkeiten aus. Das Layout ist bewusst schlicht — eine Spalte, klare Überschriften, keine Tabellen oder Grafiken —, damit er auf dem Bildschirm und auf Papier gut lesbar bleibt; lange Lebensläufe laufen automatisch auf zusätzliche Seiten über. Das PDF wird als hochauflösendes Bild erzeugt, daher ist sein Text nicht auswählbar. | changed, machine-drafted |
| `tools.cv-builder.faq1q` | de | Warum sieht das Design so schlicht aus? | Können Bewerbertracking-Systeme (ATS) das PDF lesen? | changed, machine-drafted |
| `tools.cv-builder.faq1a` | de | Die Bewerbertracking-Systeme der meisten Arbeitgeber tun sich mit mehrspaltigen Layouts, Symbolen und Textfeldern schwer. Ein einspaltiger Lebenslauf mit klaren Überschriften wird mit größerer Wahrscheinlichkeit korrekt geparst und erreicht einen menschlichen Prüfer. | Nein. Das PDF wird als hochauflösendes Bild gezeichnet, damit Arabisch und andere Schriften korrekt dargestellt werden. Dadurch ist sein Text nicht auswählbar und ATS-Software kann ihn nicht auswerten. Kopieren Sie den Text aus dem Editor, wenn Sie ihn in ein Bewerbungsformular einfügen möchten. | changed, machine-drafted |
| `tools.cv-builder.name` | es | Creador de currículum (compatible con ATS) | Creador de currículum | changed, machine-drafted |
| `tools.cv-builder.desc` | es | Crea un currículum limpio a una columna que los sistemas de selección automática puedan leer. | Crea un currículum limpio a una columna con títulos claros, listo para imprimir o guardar como PDF. | changed, machine-drafted |
| `tools.cv-builder.long` | es | Completa tu experiencia, formación y habilidades — el diseño es deliberadamente simple (una columna, títulos claros, sin tablas ni gráficos) porque es justo lo que los sistemas ATS analizan de forma fiable. Los currículums largos pasan automáticamente a páginas adicionales. | Completa tu experiencia, formación y habilidades. El diseño es deliberadamente simple —una columna, títulos claros, sin tablas ni gráficos— para que siga siendo fácil de leer en pantalla y en papel, y los currículums largos pasan automáticamente a páginas adicionales. El PDF se genera como una imagen de alta resolución, por lo que su texto no se puede seleccionar. | changed, machine-drafted |
| `tools.cv-builder.faq1q` | es | ¿Por qué el diseño es tan simple? | ¿Pueden los sistemas de seguimiento de candidatos (ATS) leer el PDF? | changed, machine-drafted |
| `tools.cv-builder.faq1a` | es | Los sistemas de seguimiento de candidatos que usan la mayoría de empresas tienen dificultades con diseños de varias columnas, iconos y cuadros de texto. Un currículum a una columna con títulos claros tiene más probabilidades de analizarse correctamente y llegar a un revisor humano. | No. El PDF se dibuja como una imagen de alta resolución para que el árabe y otros alfabetos se rendericen correctamente, lo que significa que su texto no se puede seleccionar y el software ATS no puede analizarlo. Copia el texto del editor si necesitas pegarlo en un formulario de solicitud. | changed, machine-drafted |
| `tools.cv-builder.desc` | fr | Créez un CV propre à une seule colonne que les systèmes de suivi des candidatures peuvent lire. | Créez un CV propre à une seule colonne avec des titres clairs, prêt à imprimer ou à enregistrer en PDF. | changed, machine-drafted |
| `tools.cv-builder.long` | fr | Renseignez votre expérience, votre formation et vos compétences — la mise en page est volontairement simple (une colonne, titres sobres, pas de tableaux ni graphiques) car c'est exactement ce que les logiciels ATS analysent de façon fiable. Les CV longs passent automatiquement sur des pages supplémentaires. | Renseignez votre expérience, votre formation et vos compétences. La mise en page est volontairement simple — une colonne, des titres sobres, pas de tableaux ni de graphiques — pour rester facile à lire à l'écran comme sur papier ; les CV longs passent automatiquement sur des pages supplémentaires. Le PDF est généré sous forme d'image haute résolution, son texte n'est donc pas sélectionnable. | changed, machine-drafted |
| `tools.cv-builder.faq1q` | fr | Pourquoi le design semble-t-il aussi simple ? | Les systèmes de suivi des candidatures (ATS) peuvent-ils lire le PDF ? | changed, machine-drafted |
| `tools.cv-builder.faq1a` | fr | Les systèmes de suivi des candidatures utilisés par la plupart des employeurs ont du mal avec les mises en page multi-colonnes, les icônes et les zones de texte. Un CV à une colonne avec des titres clairs a plus de chances d'être analysé correctement et d'atteindre un relecteur humain. | Non. Le PDF est dessiné sous forme d'image haute résolution pour que l'arabe et les autres écritures s'affichent correctement ; son texte n'est donc pas sélectionnable et les logiciels ATS ne peuvent pas l'analyser. Copiez le texte depuis l'éditeur si vous devez le coller dans un formulaire de candidature. | changed, machine-drafted |
| `tools.cv-builder.desc` | hi | एक स्वच्छ, एक-कॉलम रिज़्यूमे बनाएँ जिसे आवेदक-ट्रैकिंग प्रणालियाँ पढ़ सकें। | स्पष्ट शीर्षकों वाला एक स्वच्छ, एक-कॉलम रिज़्यूमे बनाएँ, जो प्रिंट करने या PDF के रूप में सहेजने के लिए तैयार हो। | changed, machine-drafted |
| `tools.cv-builder.long` | hi | अपना अनुभव, शिक्षा और कौशल भरें — लेआउट जानबूझकर सरल है (एक कॉलम, सादे शीर्षक, कोई टेबल या ग्राफ़िक्स नहीं) क्योंकि ATS सॉफ़्टवेयर ठीक यही विश्वसनीय रूप से पार्स करता है। लंबे रिज़्यूमे स्वतः अतिरिक्त पृष्ठों पर प्रवाहित होते हैं। | अपना अनुभव, शिक्षा और कौशल भरें। लेआउट जानबूझकर सरल है — एक कॉलम, सादे शीर्षक, कोई टेबल या ग्राफ़िक्स नहीं — ताकि यह स्क्रीन और कागज़ दोनों पर पढ़ने में आसान रहे, और लंबे रिज़्यूमे स्वतः अतिरिक्त पृष्ठों पर चले जाएँ। PDF उच्च-रिज़ॉल्यूशन छवि के रूप में बनाया जाता है, इसलिए इसका टेक्स्ट चुना नहीं जा सकता। | changed, machine-drafted |
| `tools.cv-builder.faq1q` | hi | डिज़ाइन इतना सादा क्यों दिखता है? | क्या आवेदक-ट्रैकिंग प्रणालियाँ (ATS) PDF पढ़ सकती हैं? | changed, machine-drafted |
| `tools.cv-builder.faq1a` | hi | अधिकांश नियोक्ताओं द्वारा उपयोग की जाने वाली आवेदक-ट्रैकिंग प्रणालियाँ बहु-कॉलम लेआउट, आइकन और टेक्स्ट बॉक्स से जूझती हैं। स्पष्ट शीर्षकों वाला एक-कॉलम रिज़्यूमे सही पार्स होने और किसी मानव समीक्षक तक पहुँचने की अधिक संभावना रखता है। | नहीं। PDF को उच्च-रिज़ॉल्यूशन छवि के रूप में बनाया जाता है ताकि अरबी और अन्य लिपियाँ सही ढंग से दिखें, जिसका अर्थ है कि इसका टेक्स्ट चुना नहीं जा सकता और ATS सॉफ़्टवेयर इसे पार्स नहीं कर सकता। यदि आपको इसे आवेदन फ़ॉर्म में पेस्ट करना है तो संपादक से टेक्स्ट कॉपी करें। | changed, machine-drafted |
| `tools.cv-builder.name` | id | Pembuat CV ATS | Pembuat CV | changed, machine-drafted |
| `tools.cv-builder.desc` | id | Buat résumé satu kolom yang bersih yang dapat dibaca sistem pelacak pelamar. | Buat résumé satu kolom yang bersih dengan judul jelas, siap dicetak atau disimpan sebagai PDF. | changed, machine-drafted |
| `tools.cv-builder.long` | id | Isi pengalaman, pendidikan, dan keterampilan Anda — tata letaknya sengaja dibuat sederhana (satu kolom, judul polos, tanpa tabel atau grafis) karena itulah yang dapat diurai dengan andal oleh perangkat lunak ATS. Résumé panjang otomatis mengalir ke halaman tambahan. | Isi pengalaman, pendidikan, dan keterampilan Anda. Tata letaknya sengaja dibuat sederhana — satu kolom, judul polos, tanpa tabel atau grafis — agar tetap mudah dibaca di layar dan di kertas, dan résumé panjang otomatis mengalir ke halaman tambahan. PDF dibuat sebagai gambar beresolusi tinggi, sehingga teksnya tidak dapat dipilih. | changed, machine-drafted |
| `tools.cv-builder.faq1q` | id | Mengapa desainnya terlihat begitu polos? | Bisakah sistem pelacak pelamar (ATS) membaca PDF? | changed, machine-drafted |
| `tools.cv-builder.faq1a` | id | Sistem pelacak pelamar yang digunakan sebagian besar pemberi kerja kesulitan dengan tata letak multi-kolom, ikon, dan kotak teks. Résumé satu kolom dengan judul yang jelas lebih mungkin diurai dengan benar dan sampai ke peninjau manusia. | Tidak. PDF digambar sebagai gambar beresolusi tinggi agar bahasa Arab dan aksara lain tampil dengan benar, yang berarti teksnya tidak dapat dipilih dan perangkat lunak ATS tidak dapat mengurainya. Salin teks dari editor jika Anda perlu menempelkannya ke formulir lamaran. | changed, machine-drafted |
| `tools.cv-builder.desc` | nl | Maak een net, éénkolomscv dat applicant tracking systems kunnen lezen. | Maak een net, éénkolomscv met duidelijke koppen, klaar om te printen of op te slaan als PDF. | changed, machine-drafted |
| `tools.cv-builder.long` | nl | Vul je ervaring, opleiding en vaardigheden in — de opmaak is bewust eenvoudig (één kolom, gewone koppen, geen tabellen of afbeeldingen), want dat is precies wat ATS-software betrouwbaar verwerkt. Lange cv's lopen automatisch door naar extra pagina's. | Vul je ervaring, opleiding en vaardigheden in. De opmaak is bewust eenvoudig — één kolom, gewone koppen, geen tabellen of afbeeldingen — zodat het prettig leesbaar blijft op scherm en papier; lange cv's lopen automatisch door naar extra pagina's. De PDF wordt gemaakt als een afbeelding met hoge resolutie, waardoor de tekst niet selecteerbaar is. | changed, machine-drafted |
| `tools.cv-builder.faq1q` | nl | Waarom ziet het ontwerp er zo eenvoudig uit? | Kunnen applicant tracking systems (ATS) de PDF lezen? | changed, machine-drafted |
| `tools.cv-builder.faq1a` | nl | Applicant tracking systems die de meeste werkgevers gebruiken, hebben moeite met meerkolomsopmaak, pictogrammen en tekstvakken. Een éénkolomscv met duidelijke koppen wordt waarschijnlijk correct verwerkt en bereikt eerder een menselijke beoordelaar. | Nee. De PDF wordt als een afbeelding met hoge resolutie getekend zodat Arabisch en andere schriften correct worden weergegeven. Daardoor is de tekst niet selecteerbaar en kan ATS-software hem niet verwerken. Kopieer de tekst uit de editor als je die in een sollicitatieformulier wilt plakken. | changed, machine-drafted |
| `tools.cv-builder.desc` | pt | Construa um currículo limpo de uma coluna que os sistemas de gestão de candidaturas conseguem ler. | Crie um currículo limpo de uma coluna com títulos claros, pronto para imprimir ou guardar como PDF. | changed, machine-drafted |
| `tools.cv-builder.long` | pt | Preencha a sua experiência, educação e competências — o layout é deliberadamente simples (uma coluna, títulos simples, sem tabelas nem gráficos) porque é exatamente isso que o software ATS analisa de forma fiável. Currículos longos fluem automaticamente para páginas adicionais. | Preencha a sua experiência, educação e competências. O layout é deliberadamente simples — uma coluna, títulos simples, sem tabelas nem gráficos — para continuar fácil de ler no ecrã e no papel, e os currículos longos passam automaticamente para páginas adicionais. O PDF é gerado como uma imagem de alta resolução, pelo que o seu texto não é selecionável. | changed, machine-drafted |
| `tools.cv-builder.faq1q` | pt | Porque é que o design parece tão simples? | Os sistemas de gestão de candidaturas (ATS) conseguem ler o PDF? | changed, machine-drafted |
| `tools.cv-builder.faq1a` | pt | Os sistemas de gestão de candidaturas usados pela maioria dos empregadores têm dificuldades com layouts de várias colunas, ícones e caixas de texto. Um currículo de uma coluna com títulos claros tem mais hipóteses de ser analisado corretamente e chegar a um avaliador humano. | Não. O PDF é desenhado como uma imagem de alta resolução para que o árabe e outros alfabetos sejam apresentados corretamente, o que significa que o seu texto não é selecionável e o software ATS não o consegue analisar. Copie o texto do editor se precisar de o colar num formulário de candidatura. | changed, machine-drafted |
| `tools.cv-builder.desc` | ru | Создавайте чистое одноколоночное резюме, которое считывают системы отслеживания кандидатов. | Создайте чистое одноколоночное резюме с чёткими заголовками, готовое к печати или сохранению в PDF. | changed, machine-drafted |
| `tools.cv-builder.long` | ru | Заполните опыт, образование и навыки — вёрстка намеренно простая (одна колонка, обычные заголовки, без таблиц и графики), потому что именно такую вёрстку ATS-программы надёжно разбирают. Длинные резюме автоматически перетекают на дополнительные страницы. | Заполните опыт, образование и навыки. Вёрстка намеренно простая — одна колонка, обычные заголовки, без таблиц и графики — чтобы резюме было удобно читать на экране и на бумаге; длинные резюме автоматически переходят на дополнительные страницы. PDF создаётся как изображение высокого разрешения, поэтому его текст нельзя выделить. | changed, machine-drafted |
| `tools.cv-builder.faq1q` | ru | Почему дизайн выглядит так просто? | Могут ли системы отслеживания кандидатов (ATS) прочитать PDF? | changed, machine-drafted |
| `tools.cv-builder.faq1a` | ru | Системы отслеживания кандидатов, используемые большинством работодателей, плохо справляются с многоколоночной вёрсткой, иконками и текстовыми полями. Одноколоночное резюме с чёткими заголовками с большей вероятностью будет распознано корректно и дойдёт до живого рекрутера. | Нет. PDF отрисовывается как изображение высокого разрешения, чтобы арабский и другие алфавиты отображались правильно, поэтому его текст нельзя выделить, а ATS-программы не могут его разобрать. Скопируйте текст из редактора, если его нужно вставить в анкету. | changed, machine-drafted |
| `tools.cv-builder.desc` | tr | Başvuru takip sistemlerinin okuyabileceği temiz, tek sütunlu bir özgeçmiş oluşturun. | Net başlıklara sahip temiz, tek sütunlu bir özgeçmiş oluşturun; yazdırmaya veya PDF olarak kaydetmeye hazır. | changed, machine-drafted |
| `tools.cv-builder.long` | tr | Deneyiminizi, eğitim ve becerilerinizi doldurun — yerleşim kasıtlı olarak basittir (tek sütun, düz başlıklar, tablo veya grafik yok) çünkü ATS yazılımının güvenilir şekilde ayrıştırdığı şey tam olarak budur. Uzun özgeçmişler otomatik olarak ek sayfalara akar. | Deneyiminizi, eğitiminizi ve becerilerinizi doldurun. Yerleşim kasıtlı olarak basittir — tek sütun, düz başlıklar, tablo veya grafik yok — böylece ekranda ve kâğıtta okunması kolay kalır; uzun özgeçmişler otomatik olarak ek sayfalara akar. PDF yüksek çözünürlüklü bir görüntü olarak oluşturulur, bu nedenle metni seçilemez. | changed, machine-drafted |
| `tools.cv-builder.faq1q` | tr | Tasarım neden bu kadar sade görünüyor? | Başvuru takip sistemleri (ATS) PDF'i okuyabilir mi? | changed, machine-drafted |
| `tools.cv-builder.faq1a` | tr | Çoğu işverenin kullandığı başvuru takip sistemleri çok sütunlu yerleşimler, simgeler ve metin kutularıyla zorlanır. Açık başlıklara sahip tek sütunlu bir özgeçmiş daha doğru ayrıştırılır ve insan inceleyiciye ulaşır. | Hayır. PDF, Arapça ve diğer yazıların doğru görünmesi için yüksek çözünürlüklü bir görüntü olarak çizilir; bu da metninin seçilemez olduğu ve ATS yazılımının onu ayrıştıramayacağı anlamına gelir. Başvuru formuna yapıştırmanız gerekirse metni düzenleyiciden kopyalayın. | changed, machine-drafted |

### T5 follow-up (not changed in this commit)

The blog article `src/content/blog/<locale>/cv-builder.json` still contains
ATS claims in all 11 locales, including the explicit false statement that the
PDF "keeps text selectable" (`en`, lines 51, 57-61, 92). Editorial articles
are outside this tool-metadata fix; they need a content rewrite by the content
owner and native review. Inventory is in `AUDIT_FIX_REPORT.md` (T5 risks).


## T6 — Invoice Generator (invoice-generator): 27 currencies and print-to-PDF

The picker offers 27 currencies, not "any currency", and the primary
button no longer downloads an `.html` file labelled "Download PDF". The
invoice is now printed by the browser (print dialog → Save as PDF), so the
saved PDF keeps real text: it is selectable and searchable. The old FAQ said
the text was not selectable, which was only true of the previous raster flow.

| Key | Language | Old | New | Status |
| --- | --- | --- | --- | --- |
| `tools.invoice-generator.desc` | en (source) | Create a professional invoice with your logo, tax and any currency. | Create a professional invoice with your logo, tax and 27 common currencies. | changed |
| `tools.invoice-generator.long` | en (source) | Fill in your company and client details, add line items, and download a polished PDF invoice — generated entirely on your device. Because Arabic text needs proper letter shaping that PDF fonts can't do directly, the invoice is rendered pixel-perfect in your browser first, then saved as a PDF page. | Fill in your company and client details, add line items, then print the invoice or save it as a PDF straight from your browser — everything is generated on your device. The layout is print-ready A4, and because the browser prints real text, the saved PDF stays selectable and searchable. | changed |
| `tools.invoice-generator.faq1a` | en (source) | No — to render Arabic, English and Spanish text correctly and consistently, the invoice is drawn as a crisp image and embedded in the PDF page. It prints and displays perfectly, but the text itself isn't selectable. | Yes. The invoice is a normal web page that your browser prints to PDF, so the text stays selectable and searchable. Arabic, English and Spanish render correctly, including right-to-left text. | changed |
| `tools.invoice-generator.faq2a` | en (source) | Yes — upload a PNG or JPG logo and pick from common currencies (USD, EUR, SAR, AED, EGP, GBP). Tax percentage and totals are calculated automatically. | Yes — upload a PNG or JPG logo and pick from 27 currencies, including USD, EUR, GBP, SAR, AED, EGP, INR and JPY. Tax percentage and totals are calculated automatically. | changed |
| `tools.invoice-generator.desc` | ar | أنشئ فاتورة احترافية بشعارك وضريبتك وأي عملة. | أنشئ فاتورة احترافية بشعارك وضريبتك و27 عملة شائعة. | changed, machine-drafted |
| `tools.invoice-generator.long` | ar | أدخل بيانات شركتك وعميلك، أضف البنود، ونزّل فاتورة PDF أنيقة — تُنشأ بالكامل على جهازك. ولأن النص العربي يحتاج تشكيلاً صحيحاً للحروف لا تقدر خطوط PDF على تنفيذه مباشرة، تُرسم الفاتورة أولاً بدقة عالية في متصفحك ثم تُحفظ كصفحة PDF. | أدخل بيانات شركتك وعميلك، أضف البنود، ثم اطبع الفاتورة أو احفظها بصيغة PDF مباشرة من متصفحك — تُنشأ بالكامل على جهازك. التصميم جاهز للطباعة بمقاس A4، ولأن المتصفح يطبع نصاً حقيقياً، يبقى ملف PDF المحفوظ قابلاً للتحديد والبحث. | changed, machine-drafted |
| `tools.invoice-generator.faq1a` | ar | لا — لعرض العربية والإنجليزية والإسبانية بشكل صحيح ومتسق، تُرسم الفاتورة كصورة حادة الوضوح وتُضمَّن في صفحة PDF. تظهر وتُطبع بشكل مثالي، لكن النص نفسه غير قابل للتحديد. | نعم. الفاتورة صفحة ويب عادية يطبعها متصفحك بصيغة PDF، لذا يبقى النص قابلاً للتحديد والبحث. تُعرض العربية والإنجليزية والإسبانية بشكل صحيح، بما في ذلك النص من اليمين إلى اليسار. | changed, machine-drafted |
| `tools.invoice-generator.faq2a` | ar | نعم — ارفع شعاراً بصيغة PNG أو JPG واختر من عملات شائعة (دولار، يورو، ريال، درهم، جنيه مصري، جنيه إسترليني). تُحسب نسبة الضريبة والإجماليات تلقائياً. | نعم — ارفع شعاراً بصيغة PNG أو JPG واختر من 27 عملة، منها الدولار واليورو والجنيه الإسترليني والريال والدرهم والجنيه المصري والروبية والين. تُحسب نسبة الضريبة والإجماليات تلقائياً. | changed, machine-drafted |
| `tools.invoice-generator.desc` | de | Eine professionelle Rechnung mit Ihrem Logo, Steuern und jeder Währung erstellen. | Eine professionelle Rechnung mit Ihrem Logo, Steuern und 27 gängigen Währungen erstellen. | changed, machine-drafted |
| `tools.invoice-generator.long` | de | Füllen Sie Ihre Unternehmens- und Kundendaten aus, fügen Sie Positionen hinzu und laden Sie eine hochwertige PDF-Rechnung herunter — vollständig auf Ihrem Gerät erzeugt. Da arabischer Text eine korrekte Buchstabenformung benötigt, die PDF-Schriften nicht direkt leisten können, wird die Rechnung zuerst pixelgenau in Ihrem Browser gerendert und dann als PDF-Seite gespeichert. | Füllen Sie Ihre Unternehmens- und Kundendaten aus, fügen Sie Positionen hinzu und drucken Sie die Rechnung oder speichern Sie sie direkt aus dem Browser als PDF — alles wird auf Ihrem Gerät erzeugt. Das Layout ist druckfertig in A4, und da der Browser echten Text druckt, bleibt die gespeicherte PDF auswählbar und durchsuchbar. | changed, machine-drafted |
| `tools.invoice-generator.faq1a` | de | Nein — um arabischen, englischen und spanischen Text korrekt und konsistent darzustellen, wird die Rechnung als gestochen scharfes Bild gezeichnet und in die PDF-Seite eingebettet. Sie lässt sich perfekt drucken und anzeigen, aber der Text selbst ist nicht auswählbar. | Ja. Die Rechnung ist eine normale Webseite, die Ihr Browser als PDF druckt; der Text bleibt daher auswählbar und durchsuchbar. Arabisch, Englisch und Spanisch werden korrekt dargestellt, auch von rechts nach links verlaufender Text. | changed, machine-drafted |
| `tools.invoice-generator.faq2a` | de | Ja — laden Sie ein PNG- oder JPG-Logo hoch und wählen Sie aus gängigen Währungen (USD, EUR, SAR, AED, EGP, GBP). Steuerprozentsatz und Summen werden automatisch berechnet. | Ja — laden Sie ein PNG- oder JPG-Logo hoch und wählen Sie aus 27 Währungen, darunter USD, EUR, GBP, SAR, AED, EGP, INR und JPY. Steuerprozentsatz und Summen werden automatisch berechnet. | changed, machine-drafted |
| `tools.invoice-generator.desc` | es | Crea una factura profesional con tu logo, impuesto y cualquier moneda. | Crea una factura profesional con tu logo, impuesto y 27 monedas habituales. | changed, machine-drafted |
| `tools.invoice-generator.long` | es | Completa los datos de tu empresa y cliente, añade conceptos, y descarga una factura PDF pulida — generada íntegramente en tu dispositivo. Como el árabe necesita un trazado correcto de letras que las fuentes de PDF no pueden hacer directamente, la factura se dibuja primero con nitidez en tu navegador y luego se guarda como página PDF. | Completa los datos de tu empresa y cliente, añade conceptos y luego imprime la factura o guárdala como PDF directamente desde tu navegador: todo se genera en tu dispositivo. El diseño está listo para imprimir en A4 y, como el navegador imprime texto real, el PDF guardado sigue siendo seleccionable y buscable. | changed, machine-drafted |
| `tools.invoice-generator.faq1a` | es | No — para mostrar árabe, inglés y español de forma correcta y consistente, la factura se dibuja como una imagen nítida y se incrusta en la página PDF. Se ve e imprime perfectamente, pero el texto no es seleccionable. | Sí. La factura es una página web normal que tu navegador imprime a PDF, así que el texto sigue siendo seleccionable y buscable. El árabe, el inglés y el español se muestran correctamente, incluido el texto de derecha a izquierda. | changed, machine-drafted |
| `tools.invoice-generator.faq2a` | es | Sí — sube un logo PNG o JPG y elige entre monedas comunes (USD, EUR, SAR, AED, EGP, GBP). El porcentaje de impuesto y los totales se calculan automáticamente. | Sí: sube un logo PNG o JPG y elige entre 27 monedas, como USD, EUR, GBP, SAR, AED, EGP, INR y JPY. El porcentaje de impuesto y los totales se calculan automáticamente. | changed, machine-drafted |
| `tools.invoice-generator.desc` | fr | Créez une facture professionnelle avec votre logo, la taxe et n'importe quelle devise. | Créez une facture professionnelle avec votre logo, la taxe et 27 devises courantes. | changed, machine-drafted |
| `tools.invoice-generator.long` | fr | Renseignez les coordonnées de votre entreprise et de votre client, ajoutez des lignes d'articles, et téléchargez une facture PDF soignée — générée entièrement sur votre appareil. Comme le texte arabe nécessite une mise en forme correcte des lettres que les polices PDF ne peuvent pas faire directement, la facture est d'abord rendue pixel parfait dans votre navigateur, puis enregistrée en page PDF. | Renseignez les coordonnées de votre entreprise et de votre client, ajoutez des lignes d'articles, puis imprimez la facture ou enregistrez-la en PDF directement depuis votre navigateur — tout est généré sur votre appareil. La mise en page est prête à imprimer en A4 et, comme le navigateur imprime du vrai texte, le PDF enregistré reste sélectionnable et consultable par recherche. | changed, machine-drafted |
| `tools.invoice-generator.faq1a` | fr | Non — pour rendre le texte arabe, anglais et espagnol correctement et de façon cohérente, la facture est dessinée en image nette et intégrée dans la page PDF. Elle s'imprime et s'affiche parfaitement, mais le texte lui-même n'est pas sélectionnable. | Oui. La facture est une page web classique que votre navigateur imprime en PDF : le texte reste donc sélectionnable et consultable par recherche. L'arabe, l'anglais et l'espagnol s'affichent correctement, y compris le texte de droite à gauche. | changed, machine-drafted |
| `tools.invoice-generator.faq2a` | fr | Oui — téléversez un logo PNG ou JPG et choisissez parmi les devises courantes (USD, EUR, SAR, AED, EGP, GBP). Le pourcentage de taxe et les totaux sont calculés automatiquement. | Oui — téléversez un logo PNG ou JPG et choisissez parmi 27 devises, dont USD, EUR, GBP, SAR, AED, EGP, INR et JPY. Le pourcentage de taxe et les totaux sont calculés automatiquement. | changed, machine-drafted |
| `tools.invoice-generator.desc` | hi | अपने लोगो, कर और किसी भी मुद्रा के साथ एक पेशेवर चालान बनाएँ। | अपने लोगो, कर और 27 सामान्य मुद्राओं के साथ एक पेशेवर चालान बनाएँ। | changed, machine-drafted |
| `tools.invoice-generator.long` | hi | अपनी कंपनी और ग्राहक विवरण भरें, लाइन आइटम जोड़ें, और एक परिष्कृत PDF चालान डाउनलोड करें — पूरी तरह आपके डिवाइस पर जनरेट। क्योंकि अरबी टेक्स्ट को उचित अक्षर-आकार चाहिए जो PDF फ़ॉन्ट सीधे नहीं कर सकते, चालान पहले आपके ब्राउज़र में पिक्सेल-परफेक्ट रेंडर होता है, फिर PDF पृष्ठ के रूप में सहेजा जाता है। | अपनी कंपनी और ग्राहक विवरण भरें, लाइन आइटम जोड़ें, फिर चालान प्रिंट करें या सीधे अपने ब्राउज़र से PDF के रूप में सहेजें — सब कुछ आपके डिवाइस पर बनता है। लेआउट A4 प्रिंट के लिए तैयार है, और चूँकि ब्राउज़र असली टेक्स्ट प्रिंट करता है, सहेजा गया PDF चयन योग्य और खोजने योग्य रहता है। | changed, machine-drafted |
| `tools.invoice-generator.faq1a` | hi | नहीं — अरबी, अंग्रेज़ी और स्पेनिश टेक्स्ट को सही और सुसंगत रेंडर करने के लिए, चालान एक स्पष्ट छवि के रूप में खींचा जाता है और PDF पृष्ठ में एम्बेड होता है। यह पूरी तरह प्रिंट और प्रदर्शित होता है, पर टेक्स्ट स्वयं चयन योग्य नहीं है। | हाँ। चालान एक सामान्य वेब पेज है जिसे आपका ब्राउज़र PDF में प्रिंट करता है, इसलिए टेक्स्ट चयन योग्य और खोजने योग्य रहता है। अरबी, अंग्रेज़ी और स्पेनिश सही ढंग से दिखते हैं, जिसमें दाएँ-से-बाएँ टेक्स्ट भी शामिल है। | changed, machine-drafted |
| `tools.invoice-generator.faq2a` | hi | हाँ — PNG या JPG लोगो अपलोड करें और सामान्य मुद्राओं (USD, EUR, SAR, AED, EGP, GBP) में से चुनें। कर प्रतिशत और योग स्वतः परिकलित होते हैं। | हाँ — PNG या JPG लोगो अपलोड करें और 27 मुद्राओं में से चुनें, जिनमें USD, EUR, GBP, SAR, AED, EGP, INR और JPY शामिल हैं। कर प्रतिशत और योग स्वतः परिकलित होते हैं। | changed, machine-drafted |
| `tools.invoice-generator.desc` | id | Buat invoice profesional, rapi, dan siap cetak secara online. | Buat invoice profesional dengan logo, pajak, dan 27 mata uang umum. | changed, machine-drafted |
| `tools.invoice-generator.long` | id | Isi detail perusahaan dan klien Anda, tambahkan item baris, dan unduh faktur PDF yang apik — dihasilkan sepenuhnya di perangkat Anda. Karena teks Arab memerlukan pembentukan huruf yang tepat yang tidak dapat dilakukan font PDF secara langsung, faktur dirender piksel-sempurna di peramban Anda terlebih dahulu, lalu disimpan sebagai halaman PDF. | Isi detail perusahaan dan klien Anda, tambahkan item baris, lalu cetak faktur atau simpan sebagai PDF langsung dari peramban Anda — semuanya dibuat di perangkat Anda. Tata letaknya siap cetak A4, dan karena peramban mencetak teks sungguhan, PDF yang disimpan tetap dapat dipilih dan dicari. | changed, machine-drafted |
| `tools.invoice-generator.faq1a` | id | Tidak — untuk merender teks Arab, Inggris, dan Spanyol dengan benar dan konsisten, faktur digambar sebagai gambar yang tajam dan disematkan di halaman PDF. Ini mencetak dan menampilkan dengan sempurna, tetapi teksnya sendiri tidak dapat dipilih. | Ya. Faktur adalah halaman web biasa yang dicetak peramban Anda ke PDF, sehingga teksnya tetap dapat dipilih dan dicari. Bahasa Arab, Inggris, dan Spanyol tampil dengan benar, termasuk teks kanan-ke-kiri. | changed, machine-drafted |
| `tools.invoice-generator.faq2a` | id | Ya — unggah logo PNG atau JPG dan pilih dari mata uang umum (USD, EUR, SAR, AED, EGP, GBP). Persentase pajak dan total dihitung secara otomatis. | Ya — unggah logo PNG atau JPG dan pilih dari 27 mata uang, termasuk USD, EUR, GBP, SAR, AED, EGP, INR, dan JPY. Persentase pajak dan total dihitung secara otomatis. | changed, machine-drafted |
| `tools.invoice-generator.desc` | nl | Maak een professionele factuur met je logo, btw en elke valuta. | Maak een professionele factuur met je logo, btw en 27 gangbare valuta's. | changed, machine-drafted |
| `tools.invoice-generator.long` | nl | Vul je bedrijfs- en klantgegevens in, voeg regels toe en download een verzorgde PDF-factuur — volledig gegenereerd op je apparaat. Omdat Arabische tekst een correcte lettervormgeving vereist die PDF-lettertypen niet direct kunnen, wordt de factuur eerst pixelperfect in je browser weergegeven en daarna opgeslagen als PDF-pagina. | Vul je bedrijfs- en klantgegevens in, voeg regels toe en print de factuur of sla hem direct vanuit je browser op als PDF — alles wordt op je apparaat gegenereerd. De opmaak is A4-klaar om te printen en omdat de browser echte tekst print, blijft de opgeslagen PDF selecteerbaar en doorzoekbaar. | changed, machine-drafted |
| `tools.invoice-generator.faq1a` | nl | Nee — om Arabische, Engelse en Spaanse tekst correct en consistent weer te geven, wordt de factuur als scherpe afbeelding getekend en ingebed in de PDF-pagina. Het print en toont perfect, maar de tekst zelf is niet selecteerbaar. | Ja. De factuur is een gewone webpagina die je browser naar PDF print, dus de tekst blijft selecteerbaar en doorzoekbaar. Arabisch, Engels en Spaans worden correct weergegeven, ook tekst van rechts naar links. | changed, machine-drafted |
| `tools.invoice-generator.faq2a` | nl | Ja — upload een PNG- of JPG-logo en kies uit gangbare valuta's (USD, EUR, SAR, AED, EGP, GBP). Het belastingpercentage en de totalen worden automatisch berekend. | Ja — upload een PNG- of JPG-logo en kies uit 27 valuta's, waaronder USD, EUR, GBP, SAR, AED, EGP, INR en JPY. Het belastingpercentage en de totalen worden automatisch berekend. | changed, machine-drafted |
| `tools.invoice-generator.desc` | pt | Crie faturas profissionais, elegantes e prontas a imprimir. | Crie fatura profissional com o seu logótipo, imposto e 27 moedas comuns. | changed, machine-drafted |
| `tools.invoice-generator.long` | pt | Preencha os dados da sua empresa e do cliente, adicione as linhas de itens e descarregue uma fatura PDF polida — gerada inteiramente no seu dispositivo. Como o texto em árabe precisa de uma formação correta de letras que os tipos de letra de PDF não conseguem fazer diretamente, a fatura é primeiro processada pixel a pixel no seu navegador e depois gravada como página PDF. | Preencha os dados da sua empresa e do cliente, adicione as linhas de itens e imprima a fatura ou guarde-a como PDF diretamente do seu navegador — tudo é gerado no seu dispositivo. O layout está pronto para impressão em A4 e, como o navegador imprime texto real, o PDF guardado continua selecionável e pesquisável. | changed, machine-drafted |
| `tools.invoice-generator.faq1a` | pt | Não — para processar texto em árabe, inglês e espanhol corretamente e de forma consistente, a fatura é desenhada como uma imagem nítida e incorporada na página PDF. Imprime e apresenta-se perfeitamente, mas o texto em si não é selecionável. | Sim. A fatura é uma página web normal que o seu navegador imprime em PDF, por isso o texto continua selecionável e pesquisável. O árabe, o inglês e o espanhol são apresentados corretamente, incluindo texto da direita para a esquerda. | changed, machine-drafted |
| `tools.invoice-generator.faq2a` | pt | Sim — carregue um logótipo PNG ou JPG e escolha entre moedas comuns (USD, EUR, SAR, AED, EGP, GBP). A percentagem de imposto e os totais são calculados automaticamente. | Sim — carregue um logótipo PNG ou JPG e escolha entre 27 moedas, incluindo USD, EUR, GBP, SAR, AED, EGP, INR e JPY. A percentagem de imposto e os totais são calculados automaticamente. | changed, machine-drafted |
| `tools.invoice-generator.desc` | ru | Создавайте профессиональный счёт с вашим логотипом, налогом и в любой валюте. | Создавайте профессиональный счёт с вашим логотипом, налогом и 27 распространёнными валютами. | changed, machine-drafted |
| `tools.invoice-generator.long` | ru | Заполните данные вашей компании и клиента, добавьте позиции и скачайте аккуратный PDF-счёт, сгенерированный полностью на вашем устройстве. Поскольку для арабского текста требуется корректное формование букв, которое шрифты PDF не могут обеспечить напрямую, счёт сначала отображается попиксельно точно в вашем браузере, а затем сохраняется как страница PDF. | Заполните данные вашей компании и клиента, добавьте позиции, затем распечатайте счёт или сохраните его в PDF прямо из браузера — всё создаётся на вашем устройстве. Макет готов к печати в формате A4, а поскольку браузер печатает настоящий текст, сохранённый PDF остаётся выделяемым и доступным для поиска. | changed, machine-drafted |
| `tools.invoice-generator.faq1a` | ru | Нет — чтобы корректно и единообразно отображать арабский, английский и испанский текст, счёт рисуется как чёткое изображение и встраивается в страницу PDF. Он отлично печатается и отображается, но сам текст не выделяется. | Да. Счёт — это обычная веб-страница, которую браузер печатает в PDF, поэтому текст остаётся выделяемым и доступным для поиска. Арабский, английский и испанский отображаются корректно, включая текст справа налево. | changed, machine-drafted |
| `tools.invoice-generator.faq2a` | ru | Да — загрузите логотип PNG или JPG и выберите из распространённых валют (USD, EUR, SAR, AED, EGP, GBP). Процент налога и итоговые суммы рассчитываются автоматически. | Да — загрузите логотип PNG или JPG и выберите из 27 валют, включая USD, EUR, GBP, SAR, AED, EGP, INR и JPY. Процент налога и итоговые суммы рассчитываются автоматически. | changed, machine-drafted |
| `tools.invoice-generator.desc` | tr | Profesyonel ve yazdırılmaya hazır fatura oluşturun. | Logonuz, verginiz ve 27 yaygın para birimiyle profesyonel bir fatura oluşturun. | changed, machine-drafted |
| `tools.invoice-generator.long` | tr | Şirket ve müşteri bilgilerinizi doldurun, satır kalemleri ekleyin ve cilalı bir PDF fatura indirin — tamamen cihazınızda oluşturulur. Arapça metin PDF fontlarının doğrudan yapamayacağı doğru harf şekillendirmesi gerektirdiğinden, fatura tarayıcınızda piksel-perfect olarak oluşturulur ve sonra PDF sayfası olarak kaydedilir. | Şirket ve müşteri bilgilerinizi doldurun, satır kalemleri ekleyin, ardından faturayı yazdırın veya doğrudan tarayıcınızdan PDF olarak kaydedin — her şey cihazınızda oluşturulur. Yerleşim A4 yazdırmaya hazırdır ve tarayıcı gerçek metni yazdırdığı için kaydedilen PDF seçilebilir ve aranabilir kalır. | changed, machine-drafted |
| `tools.invoice-generator.faq1a` | tr | Hayır — Arapça, İngilizce ve İspanyolca metni doğru ve tutarlı şekilde oluşturmak için fatura temiz bir görsel olarak çizilir ve PDF sayfasına gömülür. Mükemmel yazdırır ve görüntülenir, ancak metnin kendisi seçilebilir değildir. | Evet. Fatura, tarayıcınızın PDF'e yazdırdığı normal bir web sayfasıdır; bu nedenle metin seçilebilir ve aranabilir kalır. Arapça, İngilizce ve İspanyolca, sağdan sola metin dahil doğru görüntülenir. | changed, machine-drafted |
| `tools.invoice-generator.faq2a` | tr | Evet — PNG veya JPG logonu yüklleyin ve yaygın para birimlerinden seçin (USD, EUR, SAR, AED, EGP, GBP). Vergi yüzdesi ve toplamlar otomatik olarak hesaplanır. | Evet — PNG veya JPG logo yükleyin ve USD, EUR, GBP, SAR, AED, EGP, INR ve JPY dahil 27 para biriminden seçin. Vergi yüzdesi ve toplamlar otomatik olarak hesaplanır. | changed, machine-drafted |

UI label (the primary button):

| Key | Language | Old | New | Status |
| --- | --- | --- | --- | --- |
| `InvoiceGenerator.L.printSavePdf` | en (source) | Download PDF | Print / Save as PDF | changed |
| `InvoiceGenerator.L.printSavePdf` | ar | تنزيل PDF | طباعة / حفظ باسم PDF | changed, machine-drafted |
| `InvoiceGenerator.L.printSavePdf` | es | Descargar PDF | Imprimir / Guardar como PDF | changed, machine-drafted |

The other eight locales use the English UI labels (see T7), so no translated
string changed there. The hint inside the generated invoice HTML is English
in every locale; it is also queued for T7.


## T7 — Untranslated UI strings and locale parity

Five keys used by the tool pages and the blog pager existed only in
`en.json`, so every other locale silently fell back to English. They are now
translated. A few navigation/footer values were still English in German and
Dutch and were translated too.

New keys:

| Key | Language | Old | New | Status |
| --- | --- | --- | --- | --- |
| `tool.readGuide` | ar | — (missing, fell back to English) | اقرأ الدليل الكامل | new, machine-drafted |
| `blog.relatedPostsTitle` | ar | — (missing, fell back to English) | أدلة ذات صلة | new, machine-drafted |
| `blog.relatedPostsHint` | ar | — (missing, fell back to English) | اقرأ الدليل | new, machine-drafted |
| `blog.prevPost` | ar | — (missing, fell back to English) | الدليل السابق | new, machine-drafted |
| `blog.nextPost` | ar | — (missing, fell back to English) | الدليل التالي | new, machine-drafted |
| `tool.readGuide` | de | — (missing, fell back to English) | Den vollständigen Leitfaden lesen | new, machine-drafted |
| `blog.relatedPostsTitle` | de | — (missing, fell back to English) | Verwandte Leitfäden | new, machine-drafted |
| `blog.relatedPostsHint` | de | — (missing, fell back to English) | Leitfaden lesen | new, machine-drafted |
| `blog.prevPost` | de | — (missing, fell back to English) | Vorheriger Leitfaden | new, machine-drafted |
| `blog.nextPost` | de | — (missing, fell back to English) | Nächster Leitfaden | new, machine-drafted |
| `tool.readGuide` | es | — (missing, fell back to English) | Leer la guía completa | new, machine-drafted |
| `blog.relatedPostsTitle` | es | — (missing, fell back to English) | Guías relacionadas | new, machine-drafted |
| `blog.relatedPostsHint` | es | — (missing, fell back to English) | Leer la guía | new, machine-drafted |
| `blog.prevPost` | es | — (missing, fell back to English) | Guía anterior | new, machine-drafted |
| `blog.nextPost` | es | — (missing, fell back to English) | Guía siguiente | new, machine-drafted |
| `tool.readGuide` | fr | — (missing, fell back to English) | Lire le guide complet | new, machine-drafted |
| `blog.relatedPostsTitle` | fr | — (missing, fell back to English) | Guides associés | new, machine-drafted |
| `blog.relatedPostsHint` | fr | — (missing, fell back to English) | Lire le guide | new, machine-drafted |
| `blog.prevPost` | fr | — (missing, fell back to English) | Guide précédent | new, machine-drafted |
| `blog.nextPost` | fr | — (missing, fell back to English) | Guide suivant | new, machine-drafted |
| `tool.readGuide` | hi | — (missing, fell back to English) | पूरी गाइड पढ़ें | new, machine-drafted |
| `blog.relatedPostsTitle` | hi | — (missing, fell back to English) | संबंधित गाइड | new, machine-drafted |
| `blog.relatedPostsHint` | hi | — (missing, fell back to English) | गाइड पढ़ें | new, machine-drafted |
| `blog.prevPost` | hi | — (missing, fell back to English) | पिछली गाइड | new, machine-drafted |
| `blog.nextPost` | hi | — (missing, fell back to English) | अगली गाइड | new, machine-drafted |
| `tool.readGuide` | id | — (missing, fell back to English) | Baca panduan lengkap | new, machine-drafted |
| `blog.relatedPostsTitle` | id | — (missing, fell back to English) | Panduan terkait | new, machine-drafted |
| `blog.relatedPostsHint` | id | — (missing, fell back to English) | Baca panduan | new, machine-drafted |
| `blog.prevPost` | id | — (missing, fell back to English) | Panduan sebelumnya | new, machine-drafted |
| `blog.nextPost` | id | — (missing, fell back to English) | Panduan berikutnya | new, machine-drafted |
| `tool.readGuide` | nl | — (missing, fell back to English) | Lees de volledige gids | new, machine-drafted |
| `blog.relatedPostsTitle` | nl | — (missing, fell back to English) | Gerelateerde gidsen | new, machine-drafted |
| `blog.relatedPostsHint` | nl | — (missing, fell back to English) | Lees de gids | new, machine-drafted |
| `blog.prevPost` | nl | — (missing, fell back to English) | Vorige gids | new, machine-drafted |
| `blog.nextPost` | nl | — (missing, fell back to English) | Volgende gids | new, machine-drafted |
| `tool.readGuide` | pt | — (missing, fell back to English) | Ler o guia completo | new, machine-drafted |
| `blog.relatedPostsTitle` | pt | — (missing, fell back to English) | Guias relacionados | new, machine-drafted |
| `blog.relatedPostsHint` | pt | — (missing, fell back to English) | Ler o guia | new, machine-drafted |
| `blog.prevPost` | pt | — (missing, fell back to English) | Guia anterior | new, machine-drafted |
| `blog.nextPost` | pt | — (missing, fell back to English) | Guia seguinte | new, machine-drafted |
| `tool.readGuide` | ru | — (missing, fell back to English) | Читать полное руководство | new, machine-drafted |
| `blog.relatedPostsTitle` | ru | — (missing, fell back to English) | Похожие руководства | new, machine-drafted |
| `blog.relatedPostsHint` | ru | — (missing, fell back to English) | Читать руководство | new, machine-drafted |
| `blog.prevPost` | ru | — (missing, fell back to English) | Предыдущее руководство | new, machine-drafted |
| `blog.nextPost` | ru | — (missing, fell back to English) | Следующее руководство | new, machine-drafted |
| `tool.readGuide` | tr | — (missing, fell back to English) | Tam kılavuzu okuyun | new, machine-drafted |
| `blog.relatedPostsTitle` | tr | — (missing, fell back to English) | İlgili kılavuzlar | new, machine-drafted |
| `blog.relatedPostsHint` | tr | — (missing, fell back to English) | Kılavuzu okuyun | new, machine-drafted |
| `blog.prevPost` | tr | — (missing, fell back to English) | Önceki kılavuz | new, machine-drafted |
| `blog.nextPost` | tr | — (missing, fell back to English) | Sonraki kılavuz | new, machine-drafted |

Changed values:

| Key | Language | Old | New | Status |
| --- | --- | --- | --- | --- |
| `nav.text` | de | Text & Dev | Text & Entwicklung | changed, machine-drafted |
| `nav.tools` | de | Tools | Werkzeuge | changed, machine-drafted |
| `footer.toolsCol` | de | Tools | Werkzeuge | changed, machine-drafted |
| `nav.text` | nl | Tekst & Dev | Tekst & Ontwikkeling | changed, machine-drafted |
| `nav.tools` | nl | Tools | Hulpmiddelen | changed, machine-drafted |
| `footer.toolsCol` | nl | Tools | Hulpmiddelen | changed, machine-drafted |

`scripts/check-translations.mjs` now fails when a locale is missing a key,
changes a `{placeholder}`, has an empty value, or repeats the English value
outside a documented allowlist of acronyms, loanwords and proper nouns.


## T8 — Image to PDF: page size, orientation and margin

The three image-to-PDF tools (JPG, PNG, and the multi-image converter) now
share one page-size control: `Fit to image`, `A4` or `Letter`, with
`Portrait`/`Landscape` for the fixed sizes and a margin in pixels. The six
labels below are new keys in the `tool` namespace.

Behaviour notes for QA: the default (`Fit to image`, margin 0) reproduces the
previous output exactly. The old multi-image converter converted its pixel
margin as if it were millimetres (`margin / 2.835`); it now uses the correct
96 dpi conversion (`px * 72 / 96`), so the same margin value produces a
larger, correct margin. The input label is unchanged, so no copy was edited
for that fix.

| Key | Language | Old | New | Status |
| --- | --- | --- | --- | --- |
| `tool.pageSize` | en (source) | — (missing) | Page size | new |
| `tool.fitToImage` | en (source) | — (missing) | Fit to image | new |
| `tool.orientation` | en (source) | — (missing) | Orientation | new |
| `tool.portrait` | en (source) | — (missing) | Portrait | new |
| `tool.landscape` | en (source) | — (missing) | Landscape | new |
| `tool.marginPx` | en (source) | — (missing) | Margin (px) | new |
| `tool.pageSize` | ar | — (missing) | حجم الصفحة | new, machine-drafted |
| `tool.fitToImage` | ar | — (missing) | ملاءمة الصورة | new, machine-drafted |
| `tool.orientation` | ar | — (missing) | الاتجاه | new, machine-drafted |
| `tool.portrait` | ar | — (missing) | عمودي | new, machine-drafted |
| `tool.landscape` | ar | — (missing) | أفقي | new, machine-drafted |
| `tool.marginPx` | ar | — (missing) | الهامش (بكسل) | new, machine-drafted |
| `tool.pageSize` | de | — (missing) | Seitengröße | new, machine-drafted |
| `tool.fitToImage` | de | — (missing) | An Bild anpassen | new, machine-drafted |
| `tool.orientation` | de | — (missing) | Ausrichtung | new, machine-drafted |
| `tool.portrait` | de | — (missing) | Hochformat | new, machine-drafted |
| `tool.landscape` | de | — (missing) | Querformat | new, machine-drafted |
| `tool.marginPx` | de | — (missing) | Rand (px) | new, machine-drafted |
| `tool.pageSize` | es | — (missing) | Tamaño de página | new, machine-drafted |
| `tool.fitToImage` | es | — (missing) | Ajustar a la imagen | new, machine-drafted |
| `tool.orientation` | es | — (missing) | Orientación | new, machine-drafted |
| `tool.portrait` | es | — (missing) | Vertical | new, machine-drafted |
| `tool.landscape` | es | — (missing) | Horizontal | new, machine-drafted |
| `tool.marginPx` | es | — (missing) | Margen (px) | new, machine-drafted |
| `tool.pageSize` | fr | — (missing) | Taille de page | new, machine-drafted |
| `tool.fitToImage` | fr | — (missing) | Ajuster à l'image | new, machine-drafted |
| `tool.orientation` | fr | — (missing) | Orientation | new, machine-drafted |
| `tool.portrait` | fr | — (missing) | Portrait | new, machine-drafted |
| `tool.landscape` | fr | — (missing) | Paysage | new, machine-drafted |
| `tool.marginPx` | fr | — (missing) | Marge (px) | new, machine-drafted |
| `tool.pageSize` | hi | — (missing) | पृष्ठ आकार | new, machine-drafted |
| `tool.fitToImage` | hi | — (missing) | छवि में फ़िट करें | new, machine-drafted |
| `tool.orientation` | hi | — (missing) | अभिविन्यास | new, machine-drafted |
| `tool.portrait` | hi | — (missing) | पोर्ट्रेट | new, machine-drafted |
| `tool.landscape` | hi | — (missing) | लैंडस्केप | new, machine-drafted |
| `tool.marginPx` | hi | — (missing) | मार्जिन (px) | new, machine-drafted |
| `tool.pageSize` | id | — (missing) | Ukuran halaman | new, machine-drafted |
| `tool.fitToImage` | id | — (missing) | Sesuaikan dengan gambar | new, machine-drafted |
| `tool.orientation` | id | — (missing) | Orientasi | new, machine-drafted |
| `tool.portrait` | id | — (missing) | Potret | new, machine-drafted |
| `tool.landscape` | id | — (missing) | Lanskap | new, machine-drafted |
| `tool.marginPx` | id | — (missing) | Margin (px) | new, machine-drafted |
| `tool.pageSize` | nl | — (missing) | Paginaformaat | new, machine-drafted |
| `tool.fitToImage` | nl | — (missing) | Aan afbeelding aanpassen | new, machine-drafted |
| `tool.orientation` | nl | — (missing) | Oriëntatie | new, machine-drafted |
| `tool.portrait` | nl | — (missing) | Staand | new, machine-drafted |
| `tool.landscape` | nl | — (missing) | Liggend | new, machine-drafted |
| `tool.marginPx` | nl | — (missing) | Marge (px) | new, machine-drafted |
| `tool.pageSize` | pt | — (missing) | Tamanho da página | new, machine-drafted |
| `tool.fitToImage` | pt | — (missing) | Ajustar à imagem | new, machine-drafted |
| `tool.orientation` | pt | — (missing) | Orientação | new, machine-drafted |
| `tool.portrait` | pt | — (missing) | Vertical | new, machine-drafted |
| `tool.landscape` | pt | — (missing) | Horizontal | new, machine-drafted |
| `tool.marginPx` | pt | — (missing) | Margem (px) | new, machine-drafted |
| `tool.pageSize` | ru | — (missing) | Размер страницы | new, machine-drafted |
| `tool.fitToImage` | ru | — (missing) | По размеру изображения | new, machine-drafted |
| `tool.orientation` | ru | — (missing) | Ориентация | new, machine-drafted |
| `tool.portrait` | ru | — (missing) | Книжная | new, machine-drafted |
| `tool.landscape` | ru | — (missing) | Альбомная | new, machine-drafted |
| `tool.marginPx` | ru | — (missing) | Поля (px) | new, machine-drafted |
| `tool.pageSize` | tr | — (missing) | Sayfa boyutu | new, machine-drafted |
| `tool.fitToImage` | tr | — (missing) | Görsele sığdır | new, machine-drafted |
| `tool.orientation` | tr | — (missing) | Yön | new, machine-drafted |
| `tool.portrait` | tr | — (missing) | Dikey | new, machine-drafted |
| `tool.landscape` | tr | — (missing) | Yatay | new, machine-drafted |
| `tool.marginPx` | tr | — (missing) | Kenar boşluğu (px) | new, machine-drafted |

`tool.orientation`, `tool.portrait` (fr) and `tool.marginPx` (id) are the
same word in the target language as in English, so they are listed in the
`SAME_BY_DESIGN` allowlist of `scripts/check-translations.mjs` rather than
being force-translated.

## T9 — SEO metadata

English only. 95 tool/category descriptions in `messages/en.json` were enriched to
120–155 characters (stating the benefit plus "in your browser, no upload"). No
non-English string was changed: other locales keep their existing translations
and are listed as needing native drafts in `SEO_REPORT.md`. No machine-drafted
translations were added for T9, so there are no rows to review here.

Code changes (no translation impact):
- Removed the `keywords` meta tag from blog pages.
- Added `BreadcrumbList` JSON-LD to tool category pages (blog pages already had
  `Article` and `BreadcrumbList`).
- Added `scripts/seo-report.mjs` (`npm run seo:report`) producing `SEO_REPORT.md`.
