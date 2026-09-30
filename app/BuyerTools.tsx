import type { ReactNode } from "react";

const tabs = [["basic", "基础查询"], ["mortgage", "贷款计算器"], ["areas", "华人生活区域"], ["schools", "学区介绍"], ["resources", "Amy 的资源"]];
const areas = [
  ["Katy / Fulshear", "西部 · 新房与规划社区", "从 Cinco Ranch 到 Cross Creek Ranch、Jordan Ranch，适合一起比较新旧房、生活配套和西部通勤路线。"],
  ["Sugar Land", "西南部 · 成熟生活圈", "关注 Riverstone、Telfair、New Territory 等社区，结合超市、餐饮、医疗和工作地点筛选日常生活半径。"],
  ["Bellaire Blvd / Asiatown", "西南部 · 亚洲商业配套", "以 Bellaire Boulevard 亚洲商业走廊为参考，买菜和餐饮选择集中；不要与独立的 Bellaire 市混淆。"],
  ["Cypress", "西北部 · 多样社区选择", "可从 Bridgeland、Towne Lake、Fairfield 入手，实地比较道路出入口、商业配套与高峰期通勤。"],
  ["The Woodlands", "北部 · 林地与户外生活", "关注步道、绿地及不同 Village 的生活配套；到工作地点、亚洲超市的距离需要单独评估。"],
  ["Pearland", "南部 · 兼顾生活与通勤", "可结合 Texas Medical Center 等工作地点比较路线。不同社区的学区、地税与房屋年代应逐项核对。"],
];
const schools = [
  ["Katy ISD", "Katy 及周边部分社区", "比较具体学校的课程、选修与课后活动，并按房屋地址核实入学边界。", "https://www.katyisd.org/"],
  ["Fort Bend ISD", "Sugar Land / Missouri City 部分区域", "同一城市可能跨不同学区；结合学校报告、课程安排和接送距离选择。", "https://www.fortbendisd.gov/"],
  ["Lamar CISD", "Fulshear / Richmond 部分区域", "看新社区时，重点确认新校启用时间及当年、下一学年的学校分配。", "https://www.lcisd.org/"],
  ["Cy-Fair ISD", "Cypress 及西北部部分区域", "社区选择较多，建议先按地址定位学校，再比较课程与通勤路线。", "https://www.cfisd.net/"],
  ["Conroe ISD", "The Woodlands 及周边部分区域", "城市或社区名称不等于学区名称，先核对具体地址对应的小学、初中与高中。", "https://www.conroeisd.net/"],
  ["Pearland ISD", "Pearland 部分区域", "Pearland 并非全部属于同一学区，选房时要同时核对边界与入学要求。", "https://www.pearlandisd.org/"],
];

function External({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}<span aria-hidden="true">↗</span></a>;
}

function MoneyField({ name, label, value, max = 1000000, step = "1", suffix = "$ / 年" }: { name: string; label: string; value: number; max?: number; step?: string; suffix?: string }) {
  return <label className="buyer-field"><span>{label}</span><span className="buyer-input-wrap"><input name={name} type="number" inputMode="decimal" min={name === "price" ? "1" : "0"} max={max} step={step} defaultValue={value} required /><small>{suffix}</small></span></label>;
}

export function BuyerTools() {
  return <section className="buyer-tools section" id="houston" aria-labelledby="buyer-tools-title" data-buyer-tools>
    <div className="section-label">01 / 德州购房工具箱</div>
    <div className="buyer-heading"><div><p className="kicker">AMY’S HOMEBUYER TOOLKIT</p><h2 id="buyer-tools-title">买房前，<span>先把信息查清楚。</span></h2></div><p>从了解社区到估算预算，把常用入口放在一起。<br />以休斯顿及周边为主，陪您一步步做好准备。</p></div>
    <nav className="buyer-tabs" aria-label="购房工具分类" data-buyer-tabs>{tabs.map(([key, label], index) => <a key={key} id={`buyer-tab-${key}`} href={`#buyer-panel-${key}`} data-buyer-tab={key}><span aria-hidden="true">0{index + 1}</span>{label}</a>)}</nav>

    <div className="buyer-panel" id="buyer-panel-basic" aria-labelledby="buyer-tab-basic" data-buyer-panel="basic">
      <div className="buyer-panel-heading"><h3>基础查询</h3><p>先查地址，再比较房屋。外部查询将在新窗口打开。</p></div>
      <div className="buyer-query-grid">
        <article className="buyer-card"><span className="buyer-eyebrow">SAFETY</span><h4>犯罪与治安</h4><p>按地点、时间和案件类型了解记录，结合现场考察判断，不把单一数字当作安全保证。</p><div className="buyer-links"><External href="https://www.houstontx.gov/police/cs/index-2.htm">休斯顿警局犯罪查询</External></div><small>HPD 数据有辖区限制；Katy、Sugar Land 等地址应另向当地警局核实。无记录不等于无风险。</small></article>
        <article className="buyer-card"><span className="buyer-eyebrow">FLOOD RISK</span><h4>洪水与洪泛区</h4><p>用完整地址查看 FEMA 洪水地图；Harris County 的房屋还可交叉查询县级工具。</p><div className="buyer-links"><External href="https://msc.fema.gov/portal/home">FEMA 官方洪水地图</External><External href="https://www.harriscountyfemt.org/">Harris County 洪水查询</External></div><small>不在高风险区不代表不会积水或进水，还需查看披露、排水情况及保险报价。</small></article>
        <article className="buyer-card"><span className="buyer-eyebrow">MOVE-IN ESSENTIALS</span><h4>水 · 电 · 燃气开通</h4><p>服务商由具体地址决定，先确认供水单位、MUD 与燃气覆盖，再安排开通时间。</p><div className="buyer-links"><External href="https://www.powertochoose.org/">电力方案比较 · Power to Choose</External><External href="https://houstonpublicworks.org/utility-billing">休斯顿市供水开通</External><External href="https://www.puc.texas.gov/industry/water/utilities/gis.aspx">德州供水服务范围查询</External><External href="https://move.centerpointenergy.com/">CenterPoint 燃气开通</External></div><small>市供水入口不适用于所有郊区；电力比价仅适用于开放零售选择的地址。</small></article>
      </div>

    </div>

    <div className="buyer-panel" id="buyer-panel-mortgage" aria-labelledby="buyer-tab-mortgage" data-buyer-panel="mortgage">
      <section className="buyer-mortgage" aria-labelledby="buyer-mortgage-title">
        <div className="buyer-calculator-heading"><div><span className="buyer-eyebrow">PLAN YOUR BUDGET</span><h3 id="buyer-mortgage-title">房贷与每月预算</h3></div><span className="buyer-private">本地计算 · 不上传数据</span></div>
        <p className="buyer-calculator-intro">先算贷款本息，再加上税费与保险。默认值仅为演示，并非当前利率、税率或贷款承诺。</p>
        <div className="buyer-calculator-layout">
          <form className="buyer-calculator-form" data-mortgage-form noValidate>
            <div className="buyer-input-grid">
              <MoneyField name="price" label="房屋价格" value={400000} max={100000000} suffix="$" />
              <MoneyField name="downPercent" label="首付比例" value={20} max={100} step="0.1" suffix="%" />
              <MoneyField name="rate" label="贷款年利率（非 APR）" value={6.5} max={30} step="0.001" suffix="%" />
              <label className="buyer-field"><span>贷款年限</span><select name="years" defaultValue="30"><option value="30">30 年</option><option value="20">20 年</option><option value="15">15 年</option><option value="10">10 年</option></select></label>
              <MoneyField name="taxRate" label="预估房产税率 / 年" value={2.5} max={20} step="0.001" suffix="%" />
              <MoneyField name="insurance" label="房屋保险 / 年" value={2400} />
              <MoneyField name="hoa" label="HOA / 年" value={1200} />
              <MoneyField name="pmi" label="贷款保险 PMI / 月" value={0} max={100000} suffix="$ / 月" />
            </div>
            <div className="buyer-calc-actions"><button type="submit" className="buyer-primary" data-mortgage-submit disabled>计算月供 <span aria-hidden="true">↗</span></button><button type="reset" className="buyer-reset">恢复演示值</button></div>
            <p className="buyer-error" data-mortgage-error role="alert" hidden>请检查输入：所有项目都需填写有效的非负数字，房价须大于 0，首付须在 0–100% 之间，且不能超过字段上限。</p>
            <noscript><p>请启用 JavaScript 使用计算器；基础查询中的官方链接仍可直接访问。</p></noscript>
          </form>
          <div className="buyer-result" aria-live="polite" aria-atomic="true" data-mortgage-result>
            <p>每月持有成本估算</p><strong data-mortgage-output="total" data-locale-ignore>—</strong><small>美元 / 月 · 含以下项目</small>
            <dl>{[["payment", "贷款本息"], ["tax", "房产税"], ["insurance", "房屋保险"], ["hoa", "HOA"], ["pmi", "贷款保险 PMI"]].map(([key, title]) => <div key={key}><dt>{title}</dt><dd data-mortgage-output={key} data-locale-ignore>—</dd></div>)}</dl>
            <div className="buyer-loan-detail"><p>首付款 <b data-mortgage-output="downPayment" data-locale-ignore>—</b></p><p>贷款金额 <b data-mortgage-output="principal" data-locale-ignore>—</b></p></div>
            <p className="buyer-result-status" data-mortgage-dirty hidden>输入已修改，请点击“计算月供”更新。</p>
          </div>
        </div>
        <p className="buyer-note">按固定利率、等额本息估算；房产税暂按房价 × 输入税率计算，未扣除 Homestead 等减免。请填写包含适用 MUD 等税项的合计税率，勿重复计入。PMI 请向贷款专员询价后填写，填 0 不代表无需购买。结果不含交割费用、维修、水电气及未填入的洪水保险等费用，也不是银行账单或预批准。</p>
        <div className="buyer-calc-footer"><External href="https://www.consumerfinance.gov/ask-cfpb/on-a-mortgage-whats-the-difference-between-my-principal-and-interest-payment-and-my-total-monthly-payment-en-1941/">了解月供组成 · CFPB</External><button type="button" data-lead-open aria-haspopup="dialog" aria-controls="lead-dialog">请 Amy 帮我梳理预算 <span aria-hidden="true">↗</span></button></div>
      </section>
    </div>

    <div className="buyer-panel" id="buyer-panel-areas" aria-labelledby="buyer-tab-areas" data-buyer-panel="areas">
      <div className="buyer-panel-heading"><h3>华人关注的生活区域</h3><p>从购物、通勤与社区环境出发，找到适合自己的生活半径。</p></div>
      <div className="buyer-directory-grid">{areas.map(([name, tag, description]) => <article className="buyer-card" key={name}><span className="buyer-eyebrow">{tag}</span><h4>{name}</h4><p>{description}</p><a className="buyer-text-link" href="#services">查看生活区图文介绍 <span aria-hidden="true">↓</span></a></article>)}</div>
      <p className="buyer-note">以上为生活区域速览，不代表人口比例、区域排名或居住限制。欢迎所有购房者根据自己的需求比较；房源、通勤和服务覆盖请按具体地址确认。</p>
    </div>

    <div className="buyer-panel" id="buyer-panel-schools" aria-labelledby="buyer-tab-schools" data-buyer-panel="schools">
      <div className="buyer-panel-heading"><h3>从学区开始，落实到每个地址</h3><p>不只看评分，也看课程、孩子的需求与接送距离。</p></div>
      <div className="buyer-directory-grid">{schools.map(([name, area, description, website]) => <article className="buyer-card" key={name}><span className="buyer-eyebrow">{area}</span><h4>{name}</h4><p>{description}</p><div className="buyer-links"><External href={website}>访问学区官网</External></div></article>)}</div>
      <div className="buyer-school-footer"><p className="buyer-note">上述区域仅作定位参考，并非完整学区边界。学校分配可能调整，请以学区当年的地址查询及入学政策为准，不构成入学保证。</p><External href="https://tea.texas.gov/families-students/enrolling-and-finding-schools">TEA 官方学校与学区查询</External></div>
    </div>

    <div className="buyer-panel" id="buyer-panel-resources" aria-labelledby="buyer-tab-resources" data-buyer-panel="resources">
      <div className="buyer-panel-heading"><h3>需要专业支持时，先与 Amy 聊聊</h3><p>告诉我您的阶段与需求，一起梳理下一步该准备什么。</p></div>
      <div className="buyer-resource-grid">
        <article className="buyer-card buyer-resource"><span className="buyer-eyebrow">FINANCING</span><h4>贷款专员</h4><p>了解预批准、首付款、收入材料与贷款方案。比较利率时，也要比较 APR、点数及交割费用。</p><button type="button" className="buyer-primary" data-lead-open aria-haspopup="dialog" aria-controls="lead-dialog">咨询贷款资源 <span aria-hidden="true">↗</span></button></article>
        <article className="buyer-card buyer-resource"><span className="buyer-eyebrow">HOME INSPECTION</span><h4>独立验房师</h4><p>沟通检查范围、报告时效，以及屋顶、地基、机电系统等重点项目；按房屋情况评估是否需要专项检查。</p><button type="button" className="buyer-primary" data-lead-open aria-haspopup="dialog" aria-controls="lead-dialog">咨询验房资源 <span aria-hidden="true">↗</span></button></article>
        <article className="buyer-card buyer-resource"><span className="buyer-eyebrow">TITLE COMPANY</span><h4>产权公司</h4><p>对接产权查询、产权保险与过户交割相关事宜。具体服务范围、费用和所需材料，请向产权公司确认。</p><button type="button" className="buyer-primary" data-lead-open aria-haspopup="dialog" aria-controls="lead-dialog">咨询产权公司 <span aria-hidden="true">↗</span></button></article>
      </div>
      <p className="buyer-note">服务由您自主选择。具体资质、服务范围、收费与结果以服务机构核实及双方合同为准；贷款审批由贷款机构独立决定。</p>
    </div>
    <p className="buyer-tool-footer">Amy 为您整理 · 官方入口与实用参考 <span>链接可能更新，使用时请核对服务范围与最新说明。</span></p>
  </section>;
}
