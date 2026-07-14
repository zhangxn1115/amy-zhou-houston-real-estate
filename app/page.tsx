const services = [
  {
    title: "Katy / Fulshear",
    text: "新移民华人增长活跃，新房与大型规划社区集中。代表社区包括 Cinco Ranch、Elyson、Cross Creek Ranch 与 Jordan Ranch，兼顾学区、环境和家庭生活。",
    image: "/areas/katy.jpg",
    alt: "亚洲商业与餐饮街区氛围",
    width: 1200,
    height: 800,
  },
  {
    title: "Sugar Land",
    text: "休斯顿成熟的华人生活圈，亚洲超市、中餐、医疗与中文教育资源丰富。Riverstone、Telfair、Greatwood 等社区生活便利、配套完整。",
    image: "/areas/sugar-land.jpg",
    alt: "Sugar Land Town Square",
    width: 1280,
    height: 853,
  },
  {
    title: "Bellaire / Asiatown",
    text: "休斯顿亚洲商业中心，餐饮、超市、中医和亚洲商品高度集中。住宅较成熟，适合重视生活便利、医疗中心通勤或投资出租的买家。",
    image: "/areas/asiatown.jpg",
    alt: "休斯顿中国城绿色屋顶商业中心",
    width: 1280,
    height: 960,
  },
  {
    title: "Cypress",
    text: "快速成长的新房区域，房价通常比 Katy 更具亲和力。Bridgeland、Towne Lake 与 Fairfield 规划完善，华人家庭数量持续增加。",
    image: "/areas/cypress.jpg",
    alt: "Cypress Bridgeland 湖畔步行桥",
    width: 1024,
    height: 619,
  },
  {
    title: "The Woodlands",
    text: "森林环绕、环境优美，学区与社区管理表现突出。适合医生、企业高管、油气行业从业者及重视空间和居住品质的家庭。",
    image: "/areas/woodlands.jpg",
    alt: "林地与湖泊景观",
    width: 1200,
    height: 1716,
  },
  {
    title: "Pearland",
    text: "连接 Texas Medical Center 与 NASA 的便利选择，房价相对合理、社区成熟。受到医学中心工作人员、医生与航天行业家庭关注。",
    image: "/areas/pearland.jpg",
    alt: "Pearland Town Center",
    width: 1280,
    height: 960,
  },
];

const steps = ["了解您的需求", "制定置业方案", "筛选与实地看房", "谈判、签约与交割"];

const schoolDistricts = [
  { name: "Katy ISD", area: "Katy · Cinco Ranch · Elyson", text: "休斯顿西部家庭关注度较高的学区，覆盖多个成熟社区与大型新房社区。", website: "https://www.katyisd.org/" },
  { name: "Fort Bend ISD", area: "Sugar Land · Missouri City", text: "社区类型多元，生活配套成熟，部分学校长期受到华人家庭关注。", website: "https://www.fortbendisd.gov/" },
  { name: "Lamar CISD", area: "Fulshear · Richmond", text: "伴随西南部新社区快速发展，近年来成为新房买家的重要选择。", website: "https://www.lcisd.org/" },
  { name: "Cy-Fair ISD", area: "Cypress · Bridgeland", text: "覆盖休斯顿西北部广阔区域，拥有成熟社区与持续扩张的新规划社区。", website: "https://www.cfisd.net/" },
  { name: "Conroe ISD", area: "The Woodlands · South Montgomery", text: "服务 The Woodlands 及周边社区，适合重视自然环境与社区品质的家庭。", website: "https://www.conroeisd.net/" },
  { name: "Pearland ISD", area: "Pearland", text: "靠近医学中心与南部就业区，是兼顾通勤、社区生活和教育需求的选择。", website: "https://www.pearlandisd.org/" },
];

export default function Home() {
  return (
    <>
    <a className="skip-link" href="#main-content">跳到主要内容</a>
    <main id="main-content">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Amy Zhou 首页">
          <span className="brand-mark">AZ</span>
          <span className="brand-copy"><strong>AMY ZHOU</strong><small>HOUSTON REAL ESTATE</small></span>
        </a>
        <div className="header-contact-block">
          <div className="qr-placeholder">
            <img src="/wechat-qr.jpg" alt="Amy Zhou 微信二维码" width="830" height="830" />
          </div>
          <div className="header-contact-details">
            <p><span>电话</span><strong>+1 346 582 7694</strong></p>
            <p><span>邮箱</span><strong>ningimeng12@gmail.com</strong></p>
            <p><span>微信</span><strong>ningimengyanyan</strong></p>
          </div>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-orbit hero-orbit-one" />
        <div className="hero-orbit hero-orbit-two" />
        <div className="hero-content">
          <p className="eyebrow"><span /> 休斯顿房产经纪 · HOUSTON · TEXAS</p>
          <h1>在休斯顿，<br />找到属于您的<br /><em>理想生活。</em></h1>
          <p className="hero-intro">以专业判断理解房产，以真诚沟通理解您。<br />为全球华人家庭提供值得信赖的休斯顿置业服务。</p>
          <nav className="hero-actions" aria-label="页面重点内容">
            <a className="text-link" href="#houston">了解休斯顿房市 <span>↓</span></a>
            <a className="text-link" href="#schools">了解优质学区 <span>↓</span></a>
            <a className="text-link" href="#videos">Amy 视频看房 <span>↓</span></a>
          </nav>
        </div>

        <div className="portrait-card" aria-label="Amy Zhou 个人照片">
          <img className="portrait-photo" src="/amy-zhou.jpg" alt="休斯顿华人房产经纪 Amy Zhou" width="1280" height="1920" fetchPriority="high" decoding="async" />
          <div className="portrait-caption">
            <span>休斯顿房产经纪</span>
            <strong>Amy Zhou</strong>
            <div className="portrait-license">
              <span className="license-badge">TX</span>
              <div>
                <small>Texas Real Estate Sales Agent</small>
                <small className="license-number">License No. 839083</small>
              </div>
            </div>
          </div>
        </div>

      </section>

      <section className="trust-strip" aria-label="服务特点">
        <div><strong>中文</strong><span>母语沟通</span></div>
        <i />
        <div><strong>Houston</strong><span>本地市场</span></div>
        <i />
        <div><strong>自住 · 投资</strong><span>多元需求</span></div>
        <i />
        <div><strong>全流程</strong><span>专属陪伴</span></div>
      </section>

      <section className="about section" id="houston">
        <div className="section-label">01 / 认识休斯顿</div>
        <div className="about-heading">
          <p className="kicker">SPACE CITY · BAYOU CITY</p>
          <h2>一座充满机会，也适合<span>安家生活</span>的城市。</h2>
        </div>
        <div className="about-copy">
          <p>休斯顿是美国最具活力和包容力的都会区之一。能源、医疗、航天、制造与国际贸易共同支撑着多元经济，也让这里持续吸引来自世界各地的家庭与专业人才。</p>
          <p>宽阔的城市空间、丰富的社区选择、成熟的华人生活圈，以及相对友好的居住成本，让休斯顿同时适合家庭自住与长期资产配置。从市中心都市生活到西部优质社区，每一种生活方式都能找到对应的选择。</p>
        </div>
      </section>

      <section className="services section" id="services">
        <div className="section-topline">
          <div className="section-label light">02 / 华人生活区</div>
          <p>从成熟华人生活圈到快速成长的新社区，<br />找到适合您家庭节奏的休斯顿生活半径。</p>
        </div>
        <div className="service-grid">
          {services.map((service) => (
            <article className="service-card" key={service.title}>
              <img className="service-image" src={service.image} alt={service.alt} width={service.width} height={service.height} loading="lazy" decoding="async" />
              <h3>{service.title}</h3>
              <p>{service.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="schools section" id="schools">
        <div className="section-label">03 / 学区选择</div>
        <div className="schools-intro">
          <div>
            <p className="kicker">SCHOOLS &amp; COMMUNITIES</p>
            <h2>选一所学校，也是在选择<span>一种生活。</span></h2>
          </div>
          <p>休斯顿都会区的学区边界与社区并不完全重合。同一社区、甚至同一条街的不同房屋，都可能对应不同学校。Amy 会结合家庭需求，逐套确认地址对应学校与社区信息。</p>
        </div>
        <div className="school-grid">
          {schoolDistricts.map((district) => (
            <article className="school-card" key={district.name}>
              <span>{district.area}</span>
              <h3>{district.name}</h3>
              <p>{district.text}</p>
              <a href={district.website} target="_blank" rel="noopener noreferrer">访问学区官网 <i>↗</i></a>
            </article>
          ))}
        </div>
        <p className="school-note">学区边界、学校分配及相关信息可能调整，购房前应以学区和学校官方查询结果为准。</p>
      </section>

      <section className="videos section" id="videos">
        <div className="section-label">04 / 视频解读</div>
        <div className="video-intro">
          <div>
            <p className="kicker">HOUSTON IN FOCUS</p>
            <h2>用更直观的方式，<span>了解休斯顿。</span></h2>
          </div>
          <p>通过中文视频分享房市趋势、热门社区、学区信息与置业知识，让您在看房之前先建立清晰判断。</p>
        </div>
        <div className="video-feature">
          <iframe
            src="https://www.youtube-nocookie.com/embed/vpIqfneYAhk?si=AMng3QWfoRP0RQQ4"
            title="Amy Zhou 休斯顿房产视频解读"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
            allowFullScreen
          />
        </div>
      </section>

      <section className="process section" id="process">
        <div>
          <div className="section-label">05 / 服务流程</div>
          <p className="kicker">A CLEAR PATH HOME</p>
          <h2>安心置业，<span>从清晰开始。</span></h2>
          <p className="process-intro">跨城市、跨国家买房也可以很从容。Amy 会提前告诉您每个阶段需要准备什么，以及下一步会发生什么。</p>
        </div>
        <ol className="step-list">
          {steps.map((step, index) => (
            <li key={step}><span>0{index + 1}</span><strong>{step}</strong><i>↗</i></li>
          ))}
        </ol>
      </section>

      <section className="contact section" id="contact">
        <div className="contact-copy">
          <p className="eyebrow"><span /> LET&apos;S TALK</p>
          <h2>下一站，<br />也许就是<span>休斯顿。</span></h2>
          <p>告诉 Amy 您的计划。无论仍在初步了解，还是已经准备看房，都欢迎轻松聊聊。</p>
        </div>
        <div className="contact-card">
          <p>欢迎咨询</p>
          <a href="tel:+13465827694"><span>电话</span><strong>+1 346 582 7694</strong></a>
          <a href="mailto:ningimeng12@gmail.com"><span>邮箱</span><strong>ningimeng12@gmail.com</strong></a>
          <div><span>微信</span><strong>ningimengyanyan</strong></div>
          <div className="contact-qr">
            <img className="contact-qr-image" src="/wechat-qr.jpg" alt="Amy Zhou 微信二维码" width="830" height="830" loading="lazy" decoding="async" />
            <p><strong>微信扫码咨询</strong><small>WECHAT QR CODE</small></p>
          </div>
        </div>
      </section>

      <footer>
        <div className="brand footer-brand"><span className="brand-mark">AZ</span><span className="brand-copy"><strong>AMY ZHOU</strong><small>HOUSTON REAL ESTATE</small></span></div>
        <p>为全球华人家庭提供休斯顿房产服务</p>
        <p>Texas Real Estate Sales Agent · License #839083</p>
        <small className="image-credits">区域图片来源：Wikimedia Commons（Ed Schipul、WhisperToMe、Michael Martin、Brian Reading）及 Unsplash（Ben Kim 等），依各自开放授权使用。</small>
      </footer>
    </main>
    </>
  );
}
