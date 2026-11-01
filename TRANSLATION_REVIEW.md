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
