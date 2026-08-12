import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("generates the blog index and SEO-ready article", async () => {
  const index = await read("../site/blog/index.html");
  const article = await read("../site/blog/2026-07-18-sugar-land-ryehill-price/index.html");
  const sitemap = await read("../site/sitemap.xml");

  assert.match(index, /Sugar Land RYEHILL小区最新房源信息/);
  assert.match(index, /rel="canonical" href="https:\/\/amyzhouhomes\.net\/blog\/"/);
  assert.match(index, /rel="icon" type="image\/png" sizes="512x512" href="\/favicon\.png"/);
  assert.match(index, /sizes="32x32" href="\/favicon-32\.png"/);
  assert.match(index, /sizes="16x16" href="\/favicon-16\.png"/);
  assert.match(index, /rel="apple-touch-icon" sizes="180x180" href="\/apple-touch-icon\.png"/);
  assert.match(index, /<style>:root\{--ink:/);
  assert.doesNotMatch(index, /rel="stylesheet" href="\/assets\/blog\.css/);
  assert.match(index, /style-src 'self' 'sha256-[A-Za-z0-9+/=]+'/);
  assert.match(index, /grid-template-columns:88px minmax\(0,1fr\) 88px/);
  assert.match(index, /\.article-author-qr\{grid-column:3;grid-row:1\/4/);
  assert.match(index, /\.article-author-qr small\{[^}]*font-size:11px/);
  assert.match(index, /\.article-author-license\{[^}]*font-size:11px/);
  const inlineStyle = index.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";
  const declaredStyleHash = index.match(/style-src 'self' 'sha256-([A-Za-z0-9+/=]+)'/)?.[1] ?? "";
  assert.equal(createHash("sha256").update(inlineStyle).digest("base64"), declaredStyleHash);
  assert.match(index, /Content-Security-Policy/);
  assert.match(index, /object-src 'none'/);
  assert.match(article, /application\/ld\+json/);
  assert.match(article, /"@type":"BlogPosting"/);
  assert.match(article, /"@type":"BreadcrumbList"/);
  assert.match(article, /休斯顿房产经纪 Amy Zhou/);
  assert.match(article, /class="article-author-qr"/);
  assert.match(article, /Amy Zhou 微信二维码/);
  assert.match(article, /wechat-qr\.jpg/);
  assert.match(article, /class="article-consult-button"[^>]*data-lead-open/);
  assert.match(article, /在线咨询/);
  assert.match(article, /id="lead-dialog"/);
  assert.match(article, /action="\/api\/leads"/);
  assert.match(article, /src="\/lead-form\.js\?v=20260727-1"/);
  assert.match(article, /src="\/video-lazy\.js\?v=20260811-2"/);
  assert.doesNotMatch(article, /rel="preload"[^>]*blog-media/);
  assert.match(article, /<source srcset="\/blog-media\/_20260718140820_5_9-480\.webp 480w, \/blog-media\/_20260718140820_5_9-800\.webp 800w, \/blog-media\/_20260718140820_5_9\.webp 1200w"/);
  assert.doesNotMatch(article, /<meta name="keywords"/);
  assert.match(article, /<meta name="description" content="如果你想了解Sugar Land Ryehill/);
  assert.doesNotMatch(article, /<meta name="description" content="[^"]*提供休斯顿买房、休斯顿购房/);
  assert.match(article, /"keywords":\["休斯顿华人房产经纪"/);
  assert.match(article, /"inLanguage":"zh-CN"/);
  assert.doesNotMatch(article, /"contentUrl":"https:\/\/www\.youtube\.com/);
  assert.match(article, /class="article-breadcrumb"/);
  assert.match(article, /class="article-related"/);
  assert.match(article, /相关阅读/);
  const articleDeck = article.match(/<p class="article-deck">([^<]*)<\/p>/)?.[1] ?? "";
  assert.ok(articleDeck.length > 0);
  assert.match(articleDeck, /整理最新房源和优惠，陪你一起实地看房/);
  assert.doesNotMatch(articleDeck, /…$/);
  assert.doesNotMatch(article, /NEXT STEP|把信息变成适合您的选择/);
  assert.doesNotMatch(article, /<script>alert\(/);
  assert.match(sitemap, /https:\/\/amyzhouhomes\.net\/blog\/2026-07-18-sugar-land-ryehill-price\//);
  assert.match(sitemap, /xmlns:image="http:\/\/www\.google\.com\/schemas\/sitemap-image\/1\.1"/);
  assert.match(sitemap, /<image:loc>https:\/\/amyzhouhomes\.net\/blog-media\/_20260718140820_5_9\.jpg<\/image:loc>/);
});

test("ships a pinned Decap CMS admin configuration", async () => {
  const admin = await read("../site/admin/index.html");
  const config = await read("../site/admin/config.yml");

  assert.match(admin, /decap-cms@3\.14\.1/);
  assert.match(admin, /noindex, nofollow/);
  assert.match(config, /repo: zhangxn1115\/amy-zhou-houston-real-estate/);
  assert.match(config, /base_url: https:\/\/cms-auth\.amyzhouhomes\.net/);
  assert.match(config, /auth_endpoint: \/auth/);
  assert.match(config, /media_folder: public\/blog-media/);
  assert.match(config, /max_file_size: 12582912/);
  assert.match(config, /folder: content\/blog/);
  assert.match(config, /sortable_fields: \[date, title, category\]/);
  assert.match(config, /slug: "\{\{year\}\}-\{\{month\}\}-\{\{day\}\}-\{\{fields\.slug\}\}"/);
});

test("publishes a web-optimized copy of uploaded blog images", async () => {
  const source = await stat(new URL("../public/blog-media/_20260718140820_5_9.jpg", import.meta.url));
  const published = await stat(new URL("../site/blog-media/_20260718140820_5_9.jpg", import.meta.url));
  const webp = await stat(new URL("../site/blog-media/_20260718140820_5_9.webp", import.meta.url));
  const mobileWebp = await stat(new URL("../site/blog-media/_20260718140820_5_9-480.webp", import.meta.url));

  assert.ok(published.size <= source.size, "published image should not exceed the optimized CMS image");
  assert.ok(published.size < 1_500_000, "published image should be suitable for web delivery");
  assert.ok(webp.size < published.size, "modern browsers should receive an even smaller WebP cover");
  assert.ok(mobileWebp.size < webp.size, "mobile browsers should receive a smaller responsive cover");
});

test("publishes the California and Texas comparison with authoritative sources", async () => {
  const article = await read("../site/blog/2026-07-19-california-vs-texas-living-cost-schools-industries/index.html");
  const sitemap = await read("../site/sitemap.xml");

  assert.match(article, /产业对比：加州偏创新密度，德州偏多元与实体经济/);
  assert.match(article, /学校对比：不要比较“州”，要比较具体学区和地址/);
  assert.match(article, /生活成本对比：住房差距最大/);
  assert.match(article, /天气与气候：加州更干燥多样，德州更炎热/);
  assert.match(article, /https:\/\/www\.bea\.gov\/data\/prices-inflation\/regional-price-parities-state-and-metro-area/);
  assert.match(article, /https:\/\/www\.census\.gov\/quickfacts\/fact\/table\/TX\/HSG860223/);
  assert.match(article, /https:\/\/tea\.texas\.gov\/school-and-district-leaders\/accountability/);
  assert.match(article, /https:\/\/statesummaries\.ncics\.org\/chapter\/ca/);
  assert.match(article, /https:\/\/statesummaries\.ncics\.org\/chapter\/tx/);
  assert.match(sitemap, /https:\/\/amyzhouhomes\.net\/blog\/2026-07-19-california-vs-texas-living-cost-schools-industries\//);
});

test("publishes Amy's Houston homebuyer research toolbox and adds it to the sitemap", async () => {
  const article = await read("../site/blog/2026-07-20-houston-homebuyer-research-tools/index.html");
  const sitemap = await read("../site/sitemap.xml");

  assert.match(article, /我通常先用30分钟做一轮初筛/);
  assert.match(article, /查学区：先确认地址，再看学校表现/);
  assert.match(article, /查治安：看近期记录，也要看真实环境/);
  assert.match(article, /查洪水：两个地图要一起看/);
  assert.match(article, /查房产税：不要直接照搬卖家的税单/);
  assert.match(article, /https:\/\/txschools\.gov\//);
  assert.match(article, /https:\/\/www\.houstontx\.gov\/police\/cs\/index-1\.htm/);
  assert.match(article, /https:\/\/msc\.fema\.gov\/portal\/home/);
  assert.match(article, /https:\/\/arcweb\.hcad\.org\/parcel-viewer-v2\.0\//);
  assert.match(article, /https:\/\/www\.houstonpermittingcenter\.org\/permit-finder/);
  assert.match(article, /https:\/\/www\.helpinsure\.com\//);
  assert.match(article, /Amy整理休斯顿买房前常用的查询工具/);
  assert.match(article, /休斯顿华人房产经纪/);
  assert.match(article, /houston-homebuyer-research-tools-cover\.png/);
  assert.match(article, /houston-homebuyer-research-tools-cover\.webp/);
  assert.match(sitemap, /https:\/\/amyzhouhomes\.net\/blog\/2026-07-20-houston-homebuyer-research-tools\//);
  assert.match(sitemap, /https:\/\/amyzhouhomes\.net\/blog-media\/houston-homebuyer-research-tools-cover\.png/);
});

test("publishes Amy's personal guide to retiring in Houston", async () => {
  const article = await read("../site/blog/2026-07-21-houston-retirement-living/index.html");
  const sitemap = await read("../site/sitemap.xml");

  assert.match(article, /医疗资源，是我认为休斯顿最重要的养老优势/);
  assert.match(article, /平层住宅，是休斯顿很实用的房型优势/);
  assert.match(article, /华人生活便利，让养老不只是“住得下”，而是“住得惯”/);
  assert.match(article, /我对养老选房最看重的，是未来还能住得安心/);
  assert.match(article, /https:\/\/www\.tmc\.edu\//);
  assert.match(article, /https:\/\/profile\.tmb\.state\.tx\.us\//);
  assert.match(article, /https:\/\/www\.weather\.gov\/hgx\/climate_iah_normals_summary/);
  assert.match(article, /Amy从医疗资源、生活成本、平层住宅、气候和华人生活便利出发/);
  assert.match(article, /休斯顿华人房产经纪/);
  assert.match(article, /houston-retirement-living-cover\.jpg/);
  assert.match(article, /houston-retirement-living-cover\.webp/);
  assert.match(sitemap, /https:\/\/amyzhouhomes\.net\/blog\/2026-07-21-houston-retirement-living\//);
  assert.match(sitemap, /https:\/\/amyzhouhomes\.net\/blog-media\/houston-retirement-living-cover\.jpg/);
});

test("publishes Amy's Houston career and neighborhood guide for young professionals", async () => {
  const article = await read("../site/blog/2026-07-22-houston-young-professionals-careers-neighborhoods/index.html");
  const sitemap = await read("../site/sitemap.xml");

  assert.match(article, /休斯顿不只有石油，年轻人的工作选择比想象中更宽/);
  assert.match(article, /医疗、生命科学与健康服务/);
  assert.match(article, /能源、工程与能源转型/);
  assert.match(article, /不优先考虑学区，年轻人可以重点看这些区域/);
  assert.match(article, /刚工作，到底应该先租还是买/);
  assert.match(article, /https:\/\/www\.bls\.gov\/regions\/southwest\/news-release\/occupationalemploymentandwages_houston\.htm/);
  assert.match(article, /https:\/\/www\.ridemetro\.org\/riding-metro\/transit-services\/metrorail/);
  assert.match(article, /https:\/\/www\.nasa\.gov\/johnson\//);
  assert.match(article, /houston-young-professionals-careers-neighborhoods\.jpg/);
  assert.match(article, /houston-young-professionals-careers-neighborhoods\.webp/);
  assert.match(sitemap, /https:\/\/amyzhouhomes\.net\/blog\/2026-07-22-houston-young-professionals-careers-neighborhoods\//);
  assert.match(sitemap, /https:\/\/amyzhouhomes\.net\/blog-media\/houston-young-professionals-careers-neighborhoods\.jpg/);
});

test("publishes the Katy Tompkins video home tour with an embedded player", async () => {
  const article = await read("../site/blog/2026-07-27-katy-tompkins-home-under-280k/index.html");
  const sitemap = await read("../site/sitemap.xml");

  assert.match(article, /不到28万美元读Katy 9分高中/);
  assert.match(article, /data-video-src="https:\/\/www\.youtube-nocookie\.com\/embed\/cO_B7WL_3_A"/);
  assert.match(article, /"@type":"VideoObject"/);
  assert.match(article, /Tompkins High School/);
  assert.match(article, /挂牌价：279,900美元/);
  assert.match(article, /二手房不能只看价格和装修/);
  assert.match(article, /休斯顿华人房产经纪/);
  assert.match(article, /katy-tompkins-under-280k-video-cover\.webp/);
  assert.match(sitemap, /https:\/\/amyzhouhomes\.net\/blog\/2026-07-27-katy-tompkins-home-under-280k\//);
});

test("publishes Amy's latest Summerview inventory update", async () => {
  const article = await read("../site/blog/2026-07-28-summerview-fulshear-latest-homes/index.html");
  const sitemap = await read("../site/sitemap.xml");

  assert.match(article, /Summerview最新房源：\$299,990起售/);
  assert.match(article, /Summerview 小区本身位于/);
  assert.match(article, /Fulshear, Texas/);
  assert.match(article, /Smart Series/);
  assert.match(article, /Premier Series/);
  assert.match(article, /准现房价格从 <strong>299,990 美元<\/strong>起/);
  assert.match(article, /新房库存、成交价格、完工时间和 Builder 优惠变化都比较快/);
  assert.match(article, /https:\/\/www\.mihomes\.com\/new-homes\/texas\/greater-houston\/fulshear\/summerview/);
  assert.match(article, /summerview-latest-inventory-cover\.webp/);
  assert.match(sitemap, /https:\/\/amyzhouhomes\.net\/blog\/2026-07-28-summerview-fulshear-latest-homes\//);
  assert.match(sitemap, /https:\/\/amyzhouhomes\.net\/blog-media\/summerview-latest-inventory-cover\.jpg/);
});

test("publishes Amy's latest Cross Creek West Lennar inventory update", async () => {
  const article = await read("../site/blog/2026-07-31-cross-creek-west-lennar-latest-homes/index.html");
  const sitemap = await read("../site/sitemap.xml");

  assert.match(article, /Cross Creek West Lennar最新房源：\$352,990起/);
  assert.match(article, /2026年7月31日/);
  assert.match(article, /14套房源可售/);
  assert.match(article, /Astoria/);
  assert.match(article, /\$352,990/);
  assert.match(article, /Netcher/);
  assert.match(article, /Roseman/);
  assert.match(article, /Larwood/);
  assert.match(article, /Woodbridge Collection/);
  assert.match(article, /Pinnacle Collection/);
  assert.match(article, /参考地税率约为 <strong>3\.33%<\/strong>/);
  assert.match(article, /https:\/\/www\.lennar\.com\/new-homes\/texas\/houston\/fulshear\/cross-creek-west/);
  assert.match(article, /cross-creek-west-lennar-latest-cover\.webp/);
  assert.match(sitemap, /https:\/\/amyzhouhomes\.net\/blog\/2026-07-31-cross-creek-west-lennar-latest-homes\//);
  assert.match(sitemap, /https:\/\/amyzhouhomes\.net\/blog-media\/cross-creek-west-lennar-latest-cover\.jpg/);
});

test("publishes Amy's Katy Cinco Ranch video home tour", async () => {
  const article = await read("../site/blog/2026-07-31-katy-cinco-ranch-home-345k-video/index.html");
  const sitemap = await read("../site/sitemap.xml");

  assert.match(article, /34\.5万美元能买什么房？美国Katy学区4房独栋值不值？/);
  assert.match(article, /data-video-src="https:\/\/www\.youtube-nocookie\.com\/embed\/Gg8Nz_vnGd4"/);
  assert.match(article, /"@type":"VideoObject"/);
  assert.match(article, /挂牌价：345,000美元/);
  assert.match(article, /Cinco Ranch High School/);
  assert.match(article, /2,257平方英尺/);
  assert.match(article, /00:53｜房屋外观及双车库/);
  assert.match(article, /watch\?v=Gg8Nz_vnGd4&amp;t=529s/);
  assert.match(article, /katy-cinco-ranch-345k-video-cover\.webp/);
  assert.match(article, /休斯顿华人房产经纪/);
  assert.match(sitemap, /https:\/\/amyzhouhomes\.net\/blog\/2026-07-31-katy-cinco-ranch-home-345k-video\//);
  assert.match(sitemap, /https:\/\/amyzhouhomes\.net\/blog-media\/katy-cinco-ranch-345k-video-cover\.jpg/);
});

test("publishes Amy's latest Jordan Ranch Highland 55ft inventory update", async () => {
  const article = await read("../site/blog/2026-08-01-jordan-ranch-highland-55-latest-home/index.html");
  const sitemap = await read("../site/sitemap.xml");

  assert.match(article, /Jordan Ranch Highland 55尺最新房源/);
  assert.match(article, /2802 Peach Valley Road/);
  assert.match(article, /Denton-A/);
  assert.match(article, /2,263平方英尺/);
  assert.match(article, /4房3卫/);
  assert.match(article, /Lamar CISD/);
  assert.match(article, /46万美元段起/);
  assert.match(article, /https:\/\/www\.jordanranchtexas\.com\//);
  assert.match(article, /https:\/\/www\.highlandhomes\.com\/houston\/fulshear\/jordan-ranch\/587-147/);
  assert.match(article, /jordan-ranch-highland-55-latest-cover\.webp/);
  assert.match(sitemap, /https:\/\/amyzhouhomes\.net\/blog\/2026-08-01-jordan-ranch-highland-55-latest-home\//);
  assert.match(sitemap, /https:\/\/amyzhouhomes\.net\/blog-media\/jordan-ranch-highland-55-latest-cover\.jpg/);
});

test("publishes Amy's latest Jordan Ranch Chesmar small-home pricing update", async () => {
  const article = await read("../site/blog/2026-08-04-jordan-ranch-chesmar-small-homes-prices/index.html");
  const sitemap = await read("../site/sitemap.xml");

  assert.match(article, /Jordan Ranch Chesmar小户型最新房源：多种准现房可选/);
  assert.match(article, /2026年8月4日/);
  assert.match(article, /Chateau and Courtyard/);
  assert.match(article, /Berkley/);
  assert.match(article, /Hillcrest/);
  assert.match(article, /Viola/);
  assert.match(article, /最新报价欢迎直接联系我确认/);
  const articleBeforeRelatedReading = article.split('<aside class="article-related"')[0];
  assert.doesNotMatch(articleBeforeRelatedReading, /\$[0-9]/);
  assert.doesNotMatch(articleBeforeRelatedReading, /[0-9]{3},[0-9]{3}美元/);
  assert.match(article, /Lamar CISD/);
  assert.match(article, /https:\/\/www\.chesmar\.com\/texas\/houston-new-homes\/fulshear\/jordan-ranch-chateau-and-courtyard\//);
  assert.match(article, /jordan-ranch-chesmar-small-homes-prices-cover\.webp/);
  assert.match(sitemap, /https:\/\/amyzhouhomes\.net\/blog\/2026-08-04-jordan-ranch-chesmar-small-homes-prices\//);
  assert.match(sitemap, /https:\/\/amyzhouhomes\.net\/blog-media\/jordan-ranch-chesmar-small-homes-prices-cover\.jpg/);
});

test("publishes Amy's 2026 Houston cost of living guide", async () => {
  const article = await read("../site/blog/2026-08-05-houston-cost-of-living-guide-2026/index.html");
  const sitemap = await read("../site/sitemap.xml");

  assert.match(article, /在休斯顿生活一个月要花多少钱？衣食住行成本一次说清/);
  assert.match(article, /2026年8月5日/);
  assert.match(article, /MIT Harris County Living Wage Calculator/);
  assert.match(article, /HUD FY 2026 Fair Market Rents/);
  assert.match(article, /RideMETRO官方票价/);
  assert.match(article, /Texas Comptroller Property Tax Exemptions/);
  assert.match(article, /houston-cost-of-living-guide-2026-v2\.webp/);
  assert.match(sitemap, /https:\/\/amyzhouhomes\.net\/blog\/2026-08-05-houston-cost-of-living-guide-2026\//);
  assert.match(sitemap, /https:\/\/amyzhouhomes\.net\/blog-media\/houston-cost-of-living-guide-2026-v2\.jpg/);
});

test("publishes Amy's Summerview MI Homes video tour", async () => {
  const article = await read("../site/blog/2026-08-07-summerview-mi-homes-350k-video/index.html");
  const sitemap = await read("../site/sitemap.xml");

  assert.match(article, /35万买休斯顿四卧新房？实拍 MI Homes 高性价比社区/);
  assert.match(article, /data-video-src="https:\/\/www\.youtube-nocookie\.com\/embed\/nmipopUBtjE"/);
  assert.match(article, /"@type":"VideoObject"/);
  assert.match(article, /售价：约349,900美元/);
  assert.match(article, /1,872平方英尺/);
  assert.match(article, /Fulshear High School/);
  assert.match(article, /HOA：约726美元\/年/);
  assert.match(article, /房产税率：约3\.16%/);
  assert.match(article, /summerview-mi-homes-350k-video-cover\.webp/);
  assert.match(article, /休斯顿华人房产经纪/);
  assert.match(sitemap, /https:\/\/amyzhouhomes\.net\/blog\/2026-08-07-summerview-mi-homes-350k-video\//);
  assert.match(sitemap, /https:\/\/amyzhouhomes\.net\/blog-media\/summerview-mi-homes-350k-video-cover\.jpg/);
});

test("publishes Amy's Cross Creek West lake-home video tour", async () => {
  const article = await read("../site/blog/2026-08-10-cross-creek-west-village-builders-lake-home-video/index.html");
  const sitemap = await read("../site/sitemap.xml");

  assert.match(article, /50万在休斯顿能买什么？湖景＋子母房＋60尺大地块/);
  assert.match(article, /data-video-src="https:\/\/www\.youtube-nocookie\.com\/embed\/OFhk_QDd7tc"/);
  assert.match(article, /"@type":"VideoObject"/);
  assert.match(article, /2,792平方英尺/);
  assert.match(article, /60尺宽/);
  assert.match(article, /HOA：约1,450美元\/年/);
  assert.match(article, /房产税率：约3\.29%/);
  assert.match(article, /Fulshear High School/);
  assert.match(article, /cross-creek-west-village-builders-500k-video-cover\.webp/);
  assert.match(sitemap, /https:\/\/amyzhouhomes\.net\/blog\/2026-08-10-cross-creek-west-village-builders-lake-home-video\//);
});

test("keeps the homepage latest articles in reverse chronological order", async () => {
  const home = await read("../site/index.html");
  const crossCreekWestVideo = home.indexOf("50万在休斯顿能买什么？湖景＋子母房＋60尺大地块");
  const fulshearGuide = home.indexOf("Fulshear 到底好在哪里？为什么越来越多客户选择这里？");
  const summerviewVideo = home.indexOf("35万买休斯顿四卧新房？实拍 MI Homes 高性价比社区");

  assert.ok(crossCreekWestVideo > -1);
  assert.ok(fulshearGuide > -1);
  assert.ok(summerviewVideo > -1);
  assert.ok(crossCreekWestVideo < fulshearGuide);
  assert.ok(fulshearGuide < summerviewVideo);
  assert.match(home, /class="hero-blog-item"/);
  assert.match(home, /class="portrait-actions"/);
  assert.match(home, /class="header-qr-label">微信扫码咨询/);
  assert.ok(home.indexOf("License No. 839083") < home.indexOf("了解华人生活区"));
  assert.match(home, /href="#services">了解华人生活区/);
  assert.match(home, /rel="preload" href="\.\/amy-zhou\.jpg"/);
  assert.doesNotMatch(home, /rel="preload" href="\/(?:amy-zhou-homes-logo\.png|license-icon\.webp)"/);
});
