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
      "Oyun mekaniklerini ve karakter kontrolcüsünü Unity ve C# ile geliştirdim.",
      "Diyalog ve görev akışlarında LLM tabanlı içerik üretiminden yararlandım.",
      "UI görselleri ve doku çalışmaları için Photoshop kullandım."
    ]
  },
  2: {
    title: "Giga Pap — İndie Mobil Oyun",
    image: "photos/projects/project-2.jpg",
    link: "https://yusufatasoy.itch.io/giga-pap",
    tools: ["Unity", "C#"],
    summary: "Dünyayı kurtarmak için nesli tükenmekte olan arılardan son 3'ünü koruduğunuz 2 boyutlu boss fight'a sahip tadı damağınızda kalacak mobil oyun projesidir.",
    process: [
      "Boss fight mekaniklerini ve oyuncu kontrolcüsünü Unity üzerinde C# ile kurguladım.",
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
    tools: ["Unity", "C#", "Photoshop"],
    summary: "Giriştiğimiz en uzun soluklu olabilecek random level generator içeren projemizdir. Karakterimiz bir buton ile dünyaya açılıp düşmanlarla savaşır. Kısıldığı labaratuvardan çıkmaya çalışır.",
    process: [
      "Random level generator sistemini Unity ve C# ile yazdım.",
      "Karakter ve düşman davranışlarını kod tarafında kurguladım.",
      "Görsel varlıkları Photoshop ile hazırladım."
    ]
  },
  6: {
    title: "Siege Of Fortune - İndie Oyun",
    image: "photos/projects/project-6.jpg",
    link: "https://red-panda-studioo.itch.io/siege-of-fortune",
    tools: ["ZBrush", "Substance Painter"],
    summary: "Yüksek poligonlu karakter sculpt ve PBR doku çalışması.",
    process: [
      "Karakter sculpt'ını ZBrush'ta yüksek poligon sayısıyla oluşturdum.",
      "PBR doku setini Substance Painter ile hazırladım."
    ]
  }
};
