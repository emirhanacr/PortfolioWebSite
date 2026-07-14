// Her proje kartının "Katkım" sayfasında gösterilecek verileri.
// process alanları taslaktır — kendi sürecine göre düzenleyebilirsin.
const KATKIM_PROJECTS = {
  1: {
    title: "Martı Kaptan — Ekolojik Simülasyon",
    image: "photos/projects/project-1.jpg",
    link: "https://emirhan-acar.itch.io/marti-kaptan",
    tools: ["Unity", "C#", "LLM", "Photoshop"],
    summary: "Sıfır atık bilincini yaygınlaştırmak amacıyla gönüllü bir ekip tarafından geliştirilen; oyuncuları deniz temizliği ve atık ayrıştırma pratiğiyle buluşturan, eğitici ve etkileşimli bir mobil oyun projesidir.",
    process: [
      "GDD tamamlanıp üzerine bir de teknik GDD yazmadan koda başlamadım; teknik GDD'de sistemleri, veri akışını ve mimari kararları netleştirdim.",
      "LLM ile çalışırken sürekli güncellenen bir memory bank tuttum, ardından sistem mimarisini kurgulamaya kod yazmaktan çok daha fazla zaman ayırdım.",
      "Proje mekaniklerini ve karakter kontrolcüsünü Unity ve C# ile geliştirdim.",
      "UI görselleri ve doku çalışmaları boyut sıkıntısı olduğunda Photoshop'ta düzenleyip oyuna aktardım.",
      "Tek bir monolitik oyun mantığı yerine birbirinden habersiz çalışan bağımsız sistemler kurdum: EventBus üzerinden haberleşen, Singleton yerine ServiceLocator'a bağımlı, ReactiveProperty ile veri değiştiğinde kendini güncelleyen bir mimari.",
      "Denizaltı sahnesinde depo ve kirlilik state'lerini reaktif veri olarak tuttum, UI'ı bu veriye event ile bağlayarak hiçbir sistemin bir diğerinin iç yapısını bilmesine gerek bırakmadım.",
      "Tanker sahnesinde taşıyıcı bandı fizik motoru yerine Lerp/interpolasyonla sürdüm, nesneleri Instantiate/Destroy yerine Object Pool'dan çekerek performans bütçesini mimari kararla garantiye aldım.",
      "Ses ve kayıt katmanını ayrı bir sorumluluk olarak izole ettim: AudioManager event'leri dinleyip pitch varyasyonuyla ASMR hissi üretirken, SaveManager oyunu hiç dondurmadan asenkron olarak diske yazdı.",
      "Oyun içi animasyonları Unity Animator ile kurguladım."
    ]
  },
  2: {
    title: "Giga Pap — İndie Mobil Oyun",
    image: "photos/projects/project-2.jpg",
    link: "https://yusufatasoy.itch.io/giga-pap",
    tools: ["Unity", "C#", "LLM"],
    summary: "Dünyayı kurtarmak için nesli tükenmekte olan arılardan son 3'ünü koruduğunuz 2 boyutlu boss fight'a sahip tadı damağınızda kalacak mobil oyun projesidir.",
    process: [
      "GDD tamamlanıp üzerine bir de teknik GDD yazmadan koda başlamadım; teknik GDD'de sistemleri, veri akışını ve mimari kararları netleştirdim.",
      "LLM ile çalışırken sürekli güncellenen bir memory bank tuttum, ardından sistem mimarisini kurgulamaya kod yazmaktan çok daha fazla zaman ayırdım.",
      "Boss fight mekaniklerini ve oyuncu kontrolcüsünü Unity üzerinde C# ile kurguladım.",
      "Mimariyi tamamen event-driven kurdum; hiçbir sistem bir diğerine doğrudan referans vermedi, aralarındaki tüm iletişim tip-güvenli bir event bus üzerinden aktı.",
      "Arayüzü dağınık controller'lara bölmek yerine tek bir yöneticide topladım, böylece her panelin davranışını tek bir dosyadan okuyabildim.",
      "Bir state machine ile oyunun her anını netleştirdim; menüden tutorial'a, savunmadan zafere her geçiş tek bir kapıdan yönetildi.",
      "Her sistemi kendi sorumluluğunu bilecek, birbirine karışmadan büyüyecek şekilde tasarladım; bu da projeyi genişletirken kırılganlığı en aza indirdi.",
      "Seviye tasarımı ve dengelemeyi ekip içinde iteratif olarak test ederek şekillendirdim."
    ]
  },
  3: {
    title: "Just Drive — Level Design Projesi",
    image: "photos/projects/project-3.jpg",
    link: "https://emirhan-acar.itch.io/",
    tools: ["Unreal Engine", "Blender"],
    summary: "Gece sürüşüne çıktığınız sizi bekleyen nascar pistinde ve kayıp şehirde gezebildiğiniz bu yolda garipliklerle karşılacağınız unreal projemizdir. Assetler blender'da modellenmiştir.",
    process: [
      "Seviye tasarımını ve atmosferi Unreal Engine içinde kurdum.",
      "Sahnedeki assetleri Blender'da modelleyip Unreal'e aktardım."
    ]
  },
  4: {
    title: "Project Minguinho — Rig, Animasyon, Modelleme",
    video: { mp4: "photos/projects/project-4.mp4", webm: "photos/projects/project-4.webm" },
    link: "https://emirhan-acar.itch.io/",
    tools: ["Blender", "Premiere Pro"],
    summary: "Modeli, riglemesi ve animasyonu bana aittir.",
    process: [
      "Karakter modelini Blender'da baştan sona oluşturdum.",
      "Rig ve animasyonları yine Blender içinde hazırladım.",
      "Son montaj ve kurguyu Premiere Pro ile tamamladım."
    ]
  },
  5: {
    title: "Rabbit Hole — Roguelike İndie Oyun",
    image: "photos/projects/project-5.jpg",
    link: "https://red-panda-studioo.itch.io/rabbit-hole",
    tools: ["Unity", "C#", "Photoshop","LLM"],
    summary: "Giriştiğimiz en uzun soluklu olabilecek random level generator içeren projemizdir. Karakterimiz bir buton ile dünyaya açılıp düşmanlarla savaşır. Kısıldığı labaratuvardan çıkmaya çalışır.",
    process: [
      "GDD tamamlanıp üzerine bir de teknik GDD yazmadan koda başlamadım; teknik GDD'de sistemleri, veri akışını ve mimari kararları netleştirdim.",
      "LLM ile çalışırken sürekli güncellenen bir memory bank tuttum, ardından sistem mimarisini kurgulamaya kod yazmaktan çok daha fazla zaman ayırdım.",
      "Random level generator sistemini Unity ve C# ile yazdım.",
      "Karakter ve düşman davranışlarını kod tarafında kurguladım.",
      "Görsel varlıkları Photoshop ile hazırladım."
    ]
  },
  6: {
    title: "Siege Of Fortune - İndie Oyun",
    image: "photos/projects/project-6.jpg",
    link: "https://red-panda-studioo.itch.io/siege-of-fortune",
    tools: ["Blender", "Unity", "Photoshop"],
    summary: "Kale savunması temalı, oyunlaştırma fikrini benim önerdiğim ancak geliştirme sürecinde tamamlanamamış bir indie oyun projesidir.",
    process: [
      "Oyunlaştırma fikrini ben önerdim ve projede game designer olarak da yer aldım.",
      "Kaleyi ve üzerindeki modelleri low poly olarak Blender'da modelledim.",
      "UI tasarımlarını ben yaptım ve Photoshop ile hazırladım.",
      "Proje geliştirme sürecinde tamamlanmadan sonlandı."
    ]
  }
};
