/* Seedance 2.0 Video Generator - Frontend Logic */

// ---- State ----
let uploadedFiles = {
  firstFrame: null,
  lastFrame: null,
  refImages: [],
  refVideos: [],
  refAudios: [],
};
let pollTimers = {};
let openEdits = {};
let pollTimer = null;
let elapsedTimer = null;
let activeTab = "single";
let adminShowAll = true;
let adminFilterUser = "";

// ---- Batch State ----
let batchFiles = { images: [], video: null };
let batchFolderExpanded = {};
let batchTemplateVideoUrl = "";
let batchPresetCollection = null;

// ---- Task State ----
let cachedTasks = [];
let currentPage = 1;
let totalTasks = 0;
let totalPages = 1;
const TASKS_PER_PAGE = 50;
let prevHadRunning = false;
let deletedSuccessTotal = 0;
let deletedSuccessByUser = {};
let userCounts = {};
let loadingVideoTasks = new Set();
let prevSingleTaskStatuses = {};
let prevBatchTaskStatuses = {};

// ---- Budget State ----
let userBudgetData = null;
let _budgetLastFetch = 0;

// ---- Asset State ----
let assetCache = [];
let publicAssetCache = [];
let assetCurrentPage = 1;
let assetTotalPages = 1;
let publicAssetCurrentPage = 1;
let assetFilterStatus = "";
let assetFilterOwner = "";
let assetSubTab = "mine";
let assetUploadFile = null;
let selectedAssetId = null;
let assetPollTimers = {};

// ---- Asset Picker State ----
let assetPickerType = "image";
let assetPickerTarget = "";
let assetPickerMulti = false;
let assetPickerSelected = [];
let assetPickerCallback = null;
let pickerAssetItems = [];
let pickerCurrentPage = 1;
let pickerTotalPages = 1;

// ---- Lazy Loading ----
let videoObserver = null;

// ---- Batch Templates ----
const BATCH_TEMPLATES = {
  tpl_guahou: {
    name: "刮后面部展示",
    model: "seedance-2.0-fast",
    prompt: "请让图片1的角色严格参考 视频1 中的动作和镜头语言，场景参考图一，用手指指着脸部，固定镜头，脸部皮肤水润，水光肌，零毛孔，水润透亮，柔光质感，视频风格为现实，写实风格",
    duration: 4,
    ratio: "9:16",
    videoUrl: "asset://asset-20260420134344-k248n",
  },
  tpl_anmo: {
    name: "按摩脸部精油吸收",
    model: "seedance-2.0-fast",
    prompt: "请让 图片1 的角色严格参考 视频1 中的动作和镜头语言，双手揉着脸部，参考 图片1 的场景，参考图一的人物长相和脸部皮肤，脸部皮肤水润，水光肌，零毛孔，水润透亮，柔光质感，固定镜头，视频风格为现实，写实风格",
    duration: 6,
    ratio: "9:16",
    videoUrl: "asset://asset-20260420134349-srg4c",
  },
  tpl_dijingyou: {
    name: "滴精油抹脸",
    model: "seedance-2.0-fast",
    prompt: "请让 图片1 的角色严格参考 视频1 中的动作和镜头语言，人物微笑，手里拿着滴精管滴精油在脸部，然后单手揉着脸部让皮肤更好的吸收，参考 图片1 的场景，参考图一的人物长相和脸部皮肤，脸部皮肤水润，水光肌，零毛孔，水润透亮，柔光质感，固定镜头，视频风格为现实",
    duration: 7,
    ratio: "9:16",
    videoUrl: "asset://asset-20260420134355-h2bjj",
  },
  tpl_guazuijiao: {
    name: "刮嘴角至眼角",
    model: "seedance-2.0-fast",
    prompt: "请让 图片1的角色严格参考视频1中的动作和镜头语言，右手里拿着视频中的一个红色产品，将产品紧贴嘴角位置刮至眼角，眼角皮肤被提拉，场景参考图片1，脸部皮肤水润透亮，白皙，水光肌，零毛孔，水润透亮，柔光质感，高清细节，干净清透，自然光影，高级质感，固定镜头，视频风格为现实",
    duration: 6,
    ratio: "9:16",
    videoUrl: "asset://asset-20260420134400-zptzm",
  },
  tpl_danjiao: {
    name: "单角揉眉头至额头",
    model: "seedance-2.0-fast",
    prompt: "请 图片1的角色严格参考视频1中的动作和镜头语言，参考 图片1 场景，右手里拿着视频1中的一个红色产品，低头，双眼紧闭，将产品的一角向额头推动，嘴里缓慢呼气，脸部皮肤水润透亮，白皙，水光肌，零毛孔，水润透亮，柔光质感，高清细节，干净清透，自然光影，高级质感，固定镜头，视频风格为现实",
    duration: 6,
    ratio: "9:16",
    videoUrl: "asset://asset-20260420134405-69v54",
  },
  tpl_guameitou: {
    name: "刮眉头至眉尾",
    model: "seedance-2.0-fast",
    prompt: "请让图片1的角色严格参考视频1中的动作和镜头语言，右手里拿着视频1中的一个红色产品，低着头，将产品紧贴眉头位置从眉头刮到眉尾，闭着眼睛嘴里缓慢呼气，场景参考图片1，低角度拍摄固定镜头，视频风格为现实",
    duration: 6,
    ratio: "9:16",
    videoUrl: "asset://asset-20260420134411-x6tnm",
  },
  tpl_guabozi: {
    name: "刮脖子",
    model: "seedance-2.0-fast",
    prompt: "请图片1让的角色严格参考视频1中的动作和镜头语言，一只手手指抬着下巴，昂着头，另一只手里拿着视频1中的红色产品紧贴脖子位置来回推刮，眼睛闭起，嘴巴缓慢呼气，参考图片1的场景，固定镜头，视频风格为现实",
    duration: 5,
    ratio: "9:16",
    videoUrl: "asset://asset-20260420134417-97pqh",
  },
  tpl_guaxiaex: {
    name: "刮下颚线",
    model: "seedance-2.0-fast",
    prompt: "请让 图片1 的角色严格参考 视频1 中的动作和镜头语言，参考 图片1 的场景，手里拿着 视频1 中的红色产品紧贴着下颚线来回刮动，嘴巴缓慢呼气，人物眼睛不要眨眼，脸部皮肤水润透亮，白皙，水光肌，零毛孔，水润透亮，柔光质感，高清细节，干净清透，自然光影，高级质感，固定镜头，视频风格为现实",
    duration: 5,
    ratio: "9:16",
    videoUrl: "asset://asset-20260420134421-42r7q",
  },
  tpl_guaxiaex_jianjing: {
    name: "刮下颚线至肩颈",
    model: "seedance-2.0-fast",
    prompt: "请让图片1的角色严格参考视频1中的动作和镜头语言，参考 图片1 场景，昂着头，一只手里拿着视频1中的红色产品紧贴着脸部从下颚线刮动至肩颈，缓慢闭上眼睛嘴巴呼气，参考图一的人物长相和脸部皮肤，脸部皮肤水润，水光肌，零毛孔，水润透亮，柔光质感，固定镜头，视频风格为现实",
    duration: 7,
    ratio: "9:16",
    videoUrl: "asset://asset-20260420134427-ndrhl",
  },
  tpl_dianrou_xiayankuang: {
    name: "点揉刮下眼眶",
    model: "seedance-2.0-fast",
    prompt: "请 图片1的角色严格参考视频1中的动作和镜头景别，右手里拿着视频1中的一个红色产品，双眼紧闭，将产品紧贴眼窝位置进行点揉然后刮至眼角，眼角皮肤被提拉，嘴里缓慢呼气，脸部皮肤水润透亮，白皙，水光肌，零毛孔，水润透亮，柔光质感，高清细节，干净清透，自然光影，高级质感，固定镜头，视频风格为现实",
    duration: 6,
    ratio: "9:16",
    videoUrl: "asset://asset-20260420134432-spw6b",
  },
  tpl_dianrou_shangyankuang: {
    name: "点揉刮眼上眼眶",
    model: "seedance-2.0-fast",
    prompt: "请让图片1的角色严格参考视频1中的动作和镜头语言，右手里拿着视频1中的一个红色产品，双眼紧闭，将产品紧贴眼窝刮至眼角，眼角皮肤被提拉，嘴巴缓慢呼气，场景参考图片1，脸部皮肤水润，水光肌，零毛孔，水润透亮，柔光质感，固定镜头，视频风格为现实",
    duration: 7,
    ratio: "9:16",
    videoUrl: "asset://asset-20260420134437-czscl",
  },
  tpl_tuipingguoji: {
    name: "推苹果肌",
    model: "seedance-2.0-fast",
    prompt: "请 图片1 让的角色严格参考 视频1 中的动作和镜头语言，参考 图片1 场景，双手里拿着 视频1 中的一个红色产品紧贴左边的脸部，侧着脸看向镜头，睁着眼睛将产品紧贴脸部在苹果肌位置进行上下推刮脸部皮肤水润透亮，白皙，水光肌，零毛孔，水润透亮，柔光质感，高清细节，干净清透，自然光影，高级质感，固定镜头，视频风格为现实",
    duration: 6,
    ratio: "9:16",
    videoUrl: "asset://asset-20260420134442-mq58k",
  },
  tpl_tuipingguoji_taiyangxue: {
    name: "推苹果肌至太阳穴",
    model: "seedance-2.0-fast",
    prompt: "请让图片1的角色严格参考中的视频1动作和镜头语言，双手拿着视频1中的一个红色产品，昂着头，将产品紧贴脸部向上推，然后翻转，将产品刮至眼角，眼角皮肤被提拉，脸部皮肤水润，水光肌，零毛孔，水润透亮，柔光质感，固定镜头，视频风格为现实风格",
    duration: 6,
    ratio: "9:16",
    videoUrl: "asset://asset-20260420134447-947tn",
  },
  tpl_shuangban_pingguoji: {
    name: "双板推苹果肌",
    model: "seedance-2.0-fast",
    prompt: "请让图片1的角色严格参考视频1中的动作和镜头语言，双手分别拿着视频中的一个红色产品，将产品紧贴脸部上下推动苹果肌，场景参考图片1，脸部皮肤水润透亮，白皙，水光肌，零毛孔，水润透亮，柔光质感，高清细节，干净清透，自然光影，高级质感，固定镜头，视频风格为现实",
    duration: 5,
    ratio: "9:16",
    videoUrl: "asset://asset-20260420134452-t5c4b",
  },
  tpl_shuangban_zuijiao: {
    name: "双板刮嘴角至眼角",
    model: "seedance-2.0-fast",
    prompt: "请让图片1的角色严格参考视频1中的动作和镜头语言，双手分别拿着视频中的一个红色产品，将产品紧贴嘴角刮至太阳穴，场景参考图片1，脸部皮肤水润透亮，白皙，水光肌，零毛孔，水润透亮，柔光质感，高清细节，干净清透，自然光影，高级质感，固定镜头，视频风格为现实",
    duration: 6,
    ratio: "9:16",
    videoUrl: "asset://asset-20260420134457-g9tw8",
  },
  tpl_guaetou_fajixian: {
    name: "刮额头至发际线",
    model: "seedance-2.0-fast",
    prompt: "请图片1让的角色严格参考 视频1 中的动作和镜头语言，手里拿着 视频1 中的一个红色产品，抬头，将产品紧贴额头从右到左上下来回推刮，闭上眼睛嘴里缓慢呼气，参考 图片1 的场景，脸部皮肤水润透亮，白皙，水光肌，零毛孔，水润透亮，柔光质感，高清细节，干净清透，自然光影，高级质感，固定镜头，脸部特写",
    duration: 8,
    ratio: "9:16",
    videoUrl: "asset://asset-20260420134502-v5qhq",
  },
  tpl_hongguang: {
    name: "红光模式刮脸",
    model: "seedance-2.0-fast",
    prompt: "请让图片1的角色严格参考视频1中的动作和镜头景别，右手里拿着视频1中的一个红色产品，参考 图片1的场景，变为夜晚，产品冒着红光，闭上双眼，将产品紧贴眼窝位置刮至眼角，眼角皮肤被提拉，固定镜头，视频风格为现实",
    duration: 6,
    ratio: "9:16",
    videoUrl: "asset://asset-20260420134507-h2wvg",
  },
  tpl_guaxiaex_cemian: {
    name: "刮下颚线侧面",
    model: "seedance-2.0-fast",
    prompt: "请让图片1的角色严格参考视频1中的动作和镜语言，参考图片1的场景，参考图一的角色，侧脸，人物闭着眼睛，手里拿着视频1中的红色产品紧贴着下颚线来回刮动，嘴巴缓慢呼气，去掉手臂上的痘痘和痣，脸部皮肤水润透亮，白皙，水光肌，零毛孔，水润透亮，柔光质感，高清细节，干净清透，自然光影，高级质感，固定镜头，视频风格为现实",
    duration: 6,
    ratio: "9:16",
    videoUrl: "asset://asset-20260420134513-nl6mg",
  },
  // ---- 刮板空镜模板 ----
  tpl_kongjing_1: {
    name: "空镜1", model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 5, ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/cf1716cafb3e4d9e8ca43e82419ca13f.mp4",
  },
  tpl_kongjing_2: {
    name: "空镜2", model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 4, ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/85291f221b744a3bb73266bfdd11adf8.mp4",
  },
  tpl_kongjing_3: {
    name: "空镜3", model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 4, ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/b567c95f62ac42f6bbae61fb983a579a.mp4",
  },
  tpl_kongjing_4: {
    name: "空镜4", model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 5, ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/b0d5af1e656f4b4f8a97894dac000f5b.mp4",
  },
  tpl_kongjing_5: {
    name: "空镜5", model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 4, ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/819d0ae4370b4aeeb9fd1ae6de2f776f.mp4",
  },
  tpl_kongjing_6: {
    name: "空镜6", model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 4, ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/df519fccac1841acba5640f298d9d629.mp4",
  },
  tpl_kongjing_7: {
    name: "空镜7", model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 4, ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/26b91796e05646da8698ceab4f9675b8.mp4",
  },
  tpl_kongjing_8: {
    name: "空镜8", model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 4, ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/7b009fa581664157befed5c257761fa2.mp4",
  },
  tpl_kongjing_9: {
    name: "空镜9", model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 4, ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/49a986e55b3241a3a39a47aa8b1523b6.mp4",
  },
  tpl_kongjing_10: {
    name: "空镜10", model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 4, ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/8384aa93d90542eabaaa90c894a8590a.mp4",
  },
  tpl_kongjing_11: {
    name: "空镜11", model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 5, ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/da99a8b7f11845c4a6f9502551dc87fa.mp4",
  },
  tpl_kongjing_12: {
    name: "空镜12", model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 6, ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/d42e4a81fa6e4d3887e98597705a38dc.mp4",
  },
  tpl_kongjing_13: {
    name: "空镜13", model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 5, ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/73ec7488bf1f40b49d54a55b09f0c5a4.mp4",
  },
  tpl_kongjing_14: {
    name: "空镜14", model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 4, ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/eb9b5a1cfcfe4b229f48315c9579a90e.mp4",
  },
  tpl_kongjing_15: {
    name: "空镜15", model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 5, ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/07c930db3947498095a4cdd27585340b.mp4",
  },
  tpl_kongjing_16: {
    name: "空镜16", model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 4, ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/3e6376543eea43c49d6a6b2f92f256a9.mp4",
  },
  // ---- 安捷面部瑜伽模板 ----
  tpl_aj_dianrou_yankuang: {
    name: "点揉眼窝刮至眼角（安捷）",
    model: "seedance-2.0-fast",
    prompt: "请 图片1的角色严格参考视频1中的动作和镜头景别，右手里拿着视频1中的一个红色产品，双眼紧闭，将产品紧贴眼窝位置进行点揉然后刮至眼角，眼角皮肤被提拉，嘴里缓慢呼气，脸部皮肤水润透亮，白皙，水光肌，零毛孔，水润透亮，柔光质感，高清细节，干净清透，自然光影，高级质感，固定镜头，视频风格为现实",
    duration: 6,
    ratio: "9:16",
    videoUrl: "asset://asset-20260425135735-v87sz",
  },
  tpl_aj_zuijiao_yanjiao: {
    name: "嘴角至眼角（安捷）",
    model: "seedance-2.0-fast",
    prompt: "请让 图片1的角色严格参考视频1中的动作和镜头语言，右手里拿着视频中的一个红色产品，将产品紧贴嘴角位置刮至眼角，眼角皮肤被提拉，场景参考图片1，脸部皮肤水润透亮，白皙，水光肌，零毛孔，水润透亮，柔光质感，高清细节，干净清透，自然光影，高级质感，固定镜头，视频风格为现实",
    duration: 6,
    ratio: "9:16",
    videoUrl: "asset://asset-20260425135740-nsf5k",
  },
  tpl_aj_shuangban_gualian: {
    name: "双板刮脸（安捷）",
    model: "seedance-2.0-fast",
    prompt: "请让图片1的角色严格参考视频1中的动作和镜头语言，双手分别拿着视频中的一个红色产品，脸上涂着面霜，将产品紧贴下颚线刮动，场景参考图片1，脸部皮肤水润透亮，白皙，水光肌，零毛孔，水润透亮，柔光质感，高清细节，干净清透，自然光影，高级质感，固定镜头，视频风格为现实",
    duration: 6,
    ratio: "9:16",
    videoUrl: "asset://asset-20260425135742-gbkf7",
  },
  tpl_aj_jingyou_runfu: {
    name: "精油润肤（安捷）",
    model: "seedance-2.0-fast",
    prompt: "请让 图片1 的角色严格参考 视频1 中的动作和镜头语言，人物微笑，手里拿着滴精管滴精油在脸部，然后单手揉着脸部让皮肤更好的吸收，参考 图片1 的场景，参考图一的人物长相和脸部皮肤，脸部皮肤水润，水光肌，零毛孔，水润透亮，柔光质感，固定镜头，视频风格为现实",
    duration: 8,
    ratio: "9:16",
    videoUrl: "asset://asset-20260425135747-6wjph",
  },
  tpl_aj_tuipingguoji: {
    name: "推苹果肌至太阳穴（安捷）",
    model: "seedance-2.0-fast",
    prompt: "请让图片1的角色严格参考中的视频1动作和镜头语言，双手拿着视频1中的一个红色产品，昂着头，将产品紧贴脸部向上推，然后翻转，将产品刮至眼角，眼角皮肤被提拉，脸部皮肤水润，水光肌，零毛孔，水润透亮，柔光质感，固定镜头，视频风格为现实风格",
    duration: 6,
    ratio: "9:16",
    videoUrl: "asset://asset-20260425135752-2cj8m",
  },
  tpl_aj_guaxiaex: {
    name: "刮下颚线（安捷）",
    model: "seedance-2.0-fast",
    prompt: "请让图片1的角色严格参考视频1中的动作和镜头语言，参考图片1的场景，手里拿着视频1中的红色产品紧贴着下颚线来回刮动，嘴巴缓慢呼气，人物眼睛不要眨眼，脸部皮肤水润透亮，白皙，水光肌，零毛孔，水润透亮，柔光质感，高清细节，干净清透，自然光影，高级质感，固定镜头，视频风格为现实",
    duration: 5,
    ratio: "9:16",
    videoUrl: "asset://asset-20260425135757-v5whh",
  },
  tpl_aj_guaetou_fajixian: {
    name: "刮额头至发际线（安捷）",
    model: "seedance-2.0-fast",
    prompt: "请图片1让的角色严格参考视频1中的动作和镜头语言，手里拿着视频1中的一个红色产品，将产品紧贴额头从右到左上下来回推刮，闭上眼睛嘴里缓慢呼气，参考图片1的场景，脸部皮肤水润透亮，白皙，水光肌，零毛孔，水润透亮，柔光质感，高清细节，干净清透，自然光影，高级质感，固定镜头，脸部特写",
    duration: 5,
    ratio: "9:16",
    videoUrl: "asset://asset-20260425135803-h5khz",
  },
  tpl_aj_guaxiaex_jianjing: {
    name: "刮下颚线至肩颈（安捷）",
    model: "seedance-2.0-fast",
    prompt: "请让图片1的角色严格参考视频1中的动作和镜头语言，参考 图片1 场景，昂着头，一只手里拿着视频1中的红色产品紧贴着脸部从下颚线刮动至肩颈，缓慢闭上眼睛嘴巴呼气，参考图一的人物长相和脸部皮肤，脸部皮肤水润，水光肌，零毛孔，水润透亮，柔光质感，固定镜头，视频风格为现实",
    duration: 6,
    ratio: "9:16",
    videoUrl: "asset://asset-20260425135808-s78vn",
  },
  tpl_aj_xiaoguo: {
    name: "效果展示（安捷）",
    model: "seedance-2.0-fast",
    prompt: "请让 图片1 的角色严格参考 视频1 中的动作和镜头语言，场景参考图一，用手指指着脸部，固定镜头，脸部皮肤水润，水光肌，零毛孔，水润透亮，柔光质感，视频风格为现实",
    duration: 4,
    ratio: "9:16",
    videoUrl: "asset://asset-20260425135809-vqxkd",
  },
  tpl_aj_hongguang: {
    name: "红光刮脸（安捷）",
    model: "seedance-2.0-fast",
    prompt: "请让图片1的角色严格参考视频1中的动作和镜头景别，手里拿着视频1中的一个红色产品，参考\n图片1的场景，变为夜晚，关灯，产品冒着红光，闭上双眼，将产品紧贴眼窝位置刮至眼角，眼角皮肤被提拉，固定镜头，视频风格为现实",
    duration: 6,
    ratio: "9:16",
    videoUrl: "asset://asset-20260425135813-bzhkf",
  },
};

// ---- Preset Collections ----
const PRESET_COLLECTIONS = {
  preset_face_yoga: {
    name: "浅夏面部瑜伽",
    templates: [
      "tpl_guahou", "tpl_anmo", "tpl_dijingyou", "tpl_guazuijiao",
      "tpl_danjiao", "tpl_guameitou", "tpl_guabozi", "tpl_guaxiaex",
      "tpl_guaxiaex_jianjing", "tpl_dianrou_xiayankuang", "tpl_dianrou_shangyankuang",
      "tpl_tuipingguoji", "tpl_tuipingguoji_taiyangxue", "tpl_shuangban_pingguoji",
      "tpl_shuangban_zuijiao", "tpl_guaetou_fajixian", "tpl_hongguang",
      "tpl_guaxiaex_cemian",
    ],
  },
  preset_guaban_kongjing: {
    name: "刮板空镜",
    templates: [
      "tpl_kongjing_1", "tpl_kongjing_2", "tpl_kongjing_3", "tpl_kongjing_4",
      "tpl_kongjing_5", "tpl_kongjing_6", "tpl_kongjing_7", "tpl_kongjing_8",
      "tpl_kongjing_9", "tpl_kongjing_10", "tpl_kongjing_11", "tpl_kongjing_12",
      "tpl_kongjing_13", "tpl_kongjing_14", "tpl_kongjing_15", "tpl_kongjing_16",
    ],
  },
  preset_anjie_face_yoga: {
    name: "安捷面部瑜伽",
    templates: [
      "tpl_aj_dianrou_yankuang", "tpl_aj_zuijiao_yanjiao", "tpl_aj_shuangban_gualian",
      "tpl_aj_jingyou_runfu", "tpl_aj_tuipingguoji", "tpl_aj_guaxiaex",
      "tpl_aj_guaetou_fajixian", "tpl_aj_guaxiaex_jianjing", "tpl_aj_xiaoguo",
      "tpl_aj_hongguang",
    ],
  },
};

// ---- Debounce & Throttle Utilities ----
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ---- Lazy Loading ----
function setupVideoLazyLoading() {
  if (videoObserver) return;
  videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const video = entry.target;
        if (video.dataset.src && !video.src) {
          video.src = video.dataset.src;
          video.removeAttribute('data-src');
        }
        videoObserver.unobserve(video);
      }
    });
  }, { rootMargin: '200px' });
}

// ---- Helpers ----
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function friendlyError(msg) {
  if (!msg) return "生成失败，请重试";
  if (/[\u4e00-\u9fff]/.test(msg)) return msg;
  const lower = msg.toLowerCase();
  if (lower.includes("real person") && lower.includes("image"))
    return "上传的图片包含真人面部，平台暂不支持，请更换图片后重试";
  if (lower.includes("real person") && lower.includes("video"))
    return "上传的视频包含真人面部，平台暂不支持，请更换视频后重试";
  if (lower.includes("real person"))
    return "素材包含真人面部，平台暂不支持，请更换素材后重试";
  if (lower.includes("copyright"))
    return "生成的视频可能涉及版权限制，请修改提示词或素材后重试";
  if (lower.includes("sensitive") || lower.includes("output video may") || lower.includes("policyviolation"))
    return "生成的视频内容不符合安全规范，请修改提示词或素材后重试";
  if (lower.includes("pixel count"))
    return "参考视频分辨率过高，请压缩视频分辨率后重试";
  if (lower.includes("video size") && lower.includes("bytes"))
    return "参考视频文件太大，请压缩视频大小后重试（不超过50MB）";
  if (lower.includes("asset") && lower.includes("not found"))
    return "素材ID不存在或已失效，请检查后重试";
  if (lower.includes("parameter") && lower.includes("not valid"))
    return "参数格式不正确，请检查上传的素材是否符合要求";
  if (lower.includes("content policy") || lower.includes("safety") || lower.includes("moderation"))
    return "内容不符合安全规范，请修改后重试";
  if (lower.includes("timeout")) return "请求超时，请稍后重试";
  if (lower.includes("rate limit")) return "请求过于频繁，请稍后再试";
  if (lower.includes("internal") && lower.includes("error")) return "服务端内部错误，请稍后重试";
  if (lower.includes("balance") || lower.includes("quota") || lower.includes("insufficient"))
    return "账户额度不足，请联系管理员";
  if (lower.includes("invalid") && (lower.includes("image") || lower.includes("url")))
    return "素材链接无效，请重新上传";
  if (lower.includes("download") && lower.includes("fail")) return "素材下载失败，请重新上传";
  if (lower.includes("overload") || lower.includes("busy")) return "服务器繁忙，请稍后重试";
  if (lower.includes("network") || lower.includes("connect")) return "网络连接失败，请检查网络";
  if (lower.includes("upload") && lower.includes("fail")) return "文件上传失败，请重试";
  return "生成失败，请重试";
}

function roleLabel(role) {
  const map = {
    first_frame: "首帧", last_frame: "尾帧",
    reference_image: "参考图", reference_video: "参考视频", reference_audio: "参考音频",
  };
  return map[role] || role || "参考";
}

function extractMediaFromTask(task) {
  const media = { images: [], videos: [], audios: [] };
  const content = (task.request_body || {}).content || [];
  let imgIdx = 0, vidIdx = 0, audIdx = 0;
  for (const item of content) {
    if (item.type === "image_url") {
      const url = item.image_url.url;
      const role = item.role || "reference_image";
      media.images.push({ url, role, name: roleLabel(role) + (++imgIdx), preview: url });
    } else if (item.type === "video_url") {
      const url = item.video_url.url;
      const role = item.role || "reference_video";
      media.videos.push({ url, role, name: roleLabel(role) + (++vidIdx) });
    } else if (item.type === "audio_url") {
      const url = item.audio_url.url;
      const role = item.role || "reference_audio";
      media.audios.push({ url, role, name: roleLabel(role) + (++audIdx) });
    }
  }
  return media;
}

function showStatus(type, message) {
  const el = document.getElementById("generate-status");
  el.style.display = "block";
  el.className = `status-message ${type}`;
  el.textContent = message;
  if (type === "success" || type === "info") {
    setTimeout(() => { el.style.display = "none"; }, 5000);
  }
}

function showBatchStatus(type, message) {
  const el = document.getElementById("batch-generate-status");
  if (!el) return;
  el.style.display = "block";
  el.className = `status-message ${type}`;
  el.textContent = message;
  if (type === "success") {
    setTimeout(() => { el.style.display = "none"; }, 8000);
  }
}

function updateBatchProgress(percent, text) {
  const progress = document.getElementById("batch-progress");
  const bar = document.getElementById("batch-progress-bar");
  const textEl = document.getElementById("batch-progress-text");
  if (!progress) return;
  progress.style.display = "block";
  bar.style.width = percent + "%";
  textEl.textContent = text;
}

function hideBatchProgress() {
  const el = document.getElementById("batch-progress");
  if (el) el.style.display = "none";
}

function formatTokens(n) {
  if (n == null || isNaN(n)) return '0';
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function formatCost(n) {
  if (n == null || isNaN(n)) return '0.00';
  return Number(n).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ========== DOMContentLoaded ==========
document.addEventListener("DOMContentLoaded", () => {
  setupModeSwitch();
  setupModeTabs();
  setupPromptExpand();
  setupFileUploads();
  setupPromptCounter();
  setupGenerateButton();
  setupBatchUploads();
  setupBatchGenerateButton();
  setupTemplateShortcuts();
  setupMosaicPanel();
  setupAssetPage();
  setupSidebar();
  setupAdminPanel();
  setupToggleAllTasks();
  setupVideoLazyLoading();

  // Load initial tasks
  loadTasks();

  // Load budget for user role
  if (typeof CURRENT_ROLE !== 'undefined' && CURRENT_ROLE === 'user') {
    loadUserBudget(true);
  }

  // Cost estimate listeners
  ["model-select", "resolution-select", "duration-select", "audio-select", "count-select"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", updateCostEstimate);
  });
  // Model-resolution linkage: fast model doesn't support 1080p
  const modelSelect = document.getElementById("model-select");
  if (modelSelect) {
    modelSelect.addEventListener("change", syncResolutionWithModel);
  }
  const batchModelSelect = document.getElementById("batch-model-select");
  if (batchModelSelect) {
    batchModelSelect.addEventListener("change", syncResolutionWithModel);
  }
  syncResolutionWithModel();
  updateCostEstimate();

  // Batch folder delete buttons (event delegation)
  document.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.btn-delete-folder-simple');
    if (deleteBtn) {
      e.stopPropagation();
      e.preventDefault();
      const batchId = deleteBtn.getAttribute('data-delete-batch');
      if (batchId) deleteFolderById(batchId);
    }
  });

  // Setup batch folders toggle
  const toggleBtn = document.getElementById("toggle-batch-folders");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleAllBatchFolders();
    });
  }

  // When user switches back to this tab, immediately refresh task list
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      loadTasks();
    }
  });

  // Check cost alert for admin
  if (typeof CURRENT_ROLE !== 'undefined' && CURRENT_ROLE !== 'user') {
    fetch("/api/stats/overview").then(r => r.json()).then(data => {
      checkCostAlert(data.total_cost_yuan);
    }).catch(() => {});
  }
});

function checkCostAlert(totalCost) {
  if (typeof TOTAL_BUDGET === "undefined" || !TOTAL_BUDGET) return;
  const budget = TOTAL_BUDGET;
  const spent = totalCost || 0;
  const remaining = budget - spent;
  const remainPct = remaining / budget;

  // Determine alert level based on remaining percentage
  let level = null;
  if (remainPct <= 0.20) {
    level = { key: "20", label: "严重警告", icon: "\u26a0\ufe0f", color: "var(--danger)", barColor: "#e53935" };
  } else if (remainPct <= 0.50) {
    level = { key: "50", label: "费用预警", icon: "\u26a0\ufe0f", color: "var(--warning, #ff9800)", barColor: "#ff9800" };
  } else if (remainPct <= 0.70) {
    level = { key: "70", label: "费用提醒", icon: "\ud83d\udcb0", color: "var(--accent)", barColor: "var(--accent)" };
  }
  if (!level) return;

  // Don't show same level alert twice in same session
  const dismissKey = "cost_alert_dismissed_" + level.key;
  if (sessionStorage.getItem(dismissKey)) return;

  const usedPct = Math.min(100, ((spent / budget) * 100)).toFixed(1);
  const overlay = document.createElement("div");
  overlay.className = "cost-alert-overlay";
  overlay.innerHTML = `
    <div class="cost-alert-modal">
      <div class="cost-alert-header">
        <span class="cost-alert-icon">${level.icon}</span>
        <span class="cost-alert-level" style="color:${level.color}">${level.label}</span>
      </div>
      <div class="cost-alert-body">
        <p class="cost-alert-main">
          \u603b\u9884\u7b97\u5df2\u4f7f\u7528 <strong style="color:${level.color}">${usedPct}%</strong>
        </p>
        <div class="cost-alert-bar-wrap">
          <div class="cost-alert-bar" style="width:${usedPct}%;background:${level.barColor}"></div>
        </div>
        <div class="cost-alert-details">
          <div class="cost-alert-detail-item">
            <span class="cost-alert-detail-label">\u603b\u9884\u7b97</span>
            <span class="cost-alert-detail-value">\u00a5${formatCost(budget)}</span>
          </div>
          <div class="cost-alert-detail-item">
            <span class="cost-alert-detail-label">\u5df2\u82b1\u8d39</span>
            <span class="cost-alert-detail-value" style="color:${level.color}">\u00a5${formatCost(spent)}</span>
          </div>
          <div class="cost-alert-detail-item">
            <span class="cost-alert-detail-label">\u5269\u4f59</span>
            <span class="cost-alert-detail-value">\u00a5${formatCost(Math.max(0, remaining))}</span>
          </div>
        </div>
      </div>
      <div class="cost-alert-footer">
        <button class="cost-alert-btn cost-alert-btn-close" id="cost-alert-close">\u6211\u77e5\u9053\u4e86</button>
        <button class="cost-alert-btn cost-alert-btn-dismiss" id="cost-alert-dismiss">\u672c\u6b21\u767b\u5f55\u4e0d\u518d\u63d0\u9192</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector("#cost-alert-close").addEventListener("click", () => overlay.remove());
  overlay.querySelector("#cost-alert-dismiss").addEventListener("click", () => {
    sessionStorage.setItem(dismissKey, "1");
    overlay.remove();
  });
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
}

// ========== Mode Switch ==========
function setupModeSwitch() {
  const modeSelect = document.getElementById("mode-select");
  if (!modeSelect) return;
  modeSelect.addEventListener("change", updateUploadAreas);
}

function setupModeTabs() {
  const tabs = document.querySelectorAll('.mode-tab-btn');
  const modeSelect = document.getElementById('mode-select');
  if (!tabs.length || !modeSelect) return;
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      modeSelect.value = btn.dataset.mode;
      modeSelect.dispatchEvent(new Event("change"));
    });
  });
}

function updateUploadAreas() {
  const mode = document.getElementById("mode-select").value;
  document.querySelectorAll(".upload-area").forEach(el => el.style.display = "none");
  document.getElementById("web-search-section").style.display = "none";

  switch (mode) {
    case "text2video":
      document.getElementById("web-search-section").style.display = "block";
      break;
    case "img2video-first":
      document.getElementById("upload-area-first").style.display = "block";
      break;
    case "img2video-firstlast":
      document.getElementById("upload-area-first").style.display = "block";
      document.getElementById("upload-area-last").style.display = "block";
      break;
    case "multimodal":
      document.getElementById("upload-area-ref-images").style.display = "block";
      document.getElementById("upload-area-ref-videos").style.display = "block";
      document.getElementById("upload-area-ref-audios").style.display = "block";
      break;
  }

  resetUploadedFiles();
  updateCostEstimate();
}

function resetUploadedFiles() {
  uploadedFiles = {
    firstFrame: null, lastFrame: null,
    refImages: [], refVideos: [], refAudios: [],
  };
  document.querySelectorAll(".file-preview, .file-preview-list").forEach(el => el.innerHTML = "");
  document.querySelectorAll(".drop-text").forEach(el => el.style.display = "");
}

// ========== Prompt ==========
function setupPromptCounter() {
  const textarea = document.getElementById("prompt-input");
  const counter = document.getElementById("char-count");
  if (!textarea || !counter) return;
  textarea.addEventListener("input", () => {
    counter.textContent = textarea.value.length;
  });
}

function setupPromptExpand() {
  const expandBtn = document.getElementById('prompt-expand-btn');
  if (!expandBtn) return;
  expandBtn.addEventListener('click', () => {
    const promptInput = document.getElementById('prompt-input');
    const charCounter = document.getElementById('char-count');
    const overlay = document.createElement('div');
    overlay.className = 'prompt-fullscreen-overlay';
    overlay.innerHTML = `
      <div class="pf-header">
        <span class="pf-title">编辑提示词</span>
        <span class="pf-char-count"><span class="pf-count-num">${promptInput.value.length}</span> / 500 字</span>
        <button class="pf-close" title="关闭">&times;</button>
      </div>
      <textarea class="pf-textarea" placeholder="描述你希望生成的视频内容...">${promptInput.value.replace(/</g, '&lt;')}</textarea>
      <div class="pf-footer">
        <button class="pf-done-btn">完成</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const pfTextarea = overlay.querySelector('.pf-textarea');
    const pfCountNum = overlay.querySelector('.pf-count-num');
    const pfClose = overlay.querySelector('.pf-close');
    const pfDone = overlay.querySelector('.pf-done-btn');

    pfTextarea.focus();
    pfTextarea.setSelectionRange(pfTextarea.value.length, pfTextarea.value.length);

    pfTextarea.addEventListener('input', () => {
      pfCountNum.textContent = pfTextarea.value.length;
    });

    function closeOverlay() {
      promptInput.value = pfTextarea.value;
      promptInput.dispatchEvent(new Event('input'));
      overlay.remove();
    }

    pfClose.addEventListener('click', closeOverlay);
    pfDone.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(); });
    overlay.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeOverlay(); });
  });
}

// ========== File Uploads ==========
function setupFileUploads() {
  setupSingleFileUpload("first-frame-input", "first-frame-preview", "firstFrame", "image");
  setupSingleFileUpload("last-frame-input", "last-frame-preview", "lastFrame", "image");
  setupMultiFileUpload("ref-images-input", "ref-images-preview", "refImages", "image", 9);
  setupMultiFileUpload("ref-videos-input", "ref-videos-preview", "refVideos", "video", 3);
  setupMultiFileUpload("ref-audios-input", "ref-audios-preview", "refAudios", "audio", 3);

  document.querySelectorAll(".file-drop").forEach(drop => {
    drop.addEventListener("click", (e) => {
      if (e.target.closest(".preview-remove") || e.target.closest(".btn-asset-pick")) return;
      const targetId = drop.dataset.target;
      if (targetId) document.getElementById(targetId).click();
    });
    drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("drag-over"); });
    drop.addEventListener("dragleave", () => drop.classList.remove("drag-over"));
    drop.addEventListener("drop", (e) => {
      e.preventDefault();
      drop.classList.remove("drag-over");
      const targetId = drop.dataset.target;
      if (!targetId) return;
      const input = document.getElementById(targetId);
      input.files = e.dataTransfer.files;
      input.dispatchEvent(new Event("change"));
    });
  });
}

function setupSingleFileUpload(inputId, previewId, stateKey, type) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;
    const preview = document.getElementById(previewId);
    const dropText = input.closest(".file-drop").querySelector(".drop-text");
    if (type === "image") {
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.innerHTML = `<img src="${e.target.result}" onclick="previewMedia('${stateKey}', 0)" style="cursor:pointer;">`;
        dropText.style.display = "none";
      };
      reader.readAsDataURL(file);
    }
    uploadedFiles[stateKey] = { file, url: null, name: file.name };
    updateCostEstimate();
  });
}

function setupMultiFileUpload(inputId, previewId, stateKey, type, maxCount) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener("change", () => {
    const files = Array.from(input.files);
    const preview = document.getElementById(previewId);
    const dropText = input.closest(".file-drop").querySelector(".drop-text");
    const remaining = maxCount - uploadedFiles[stateKey].length;
    const toAdd = files.slice(0, remaining);

    toAdd.forEach((file) => {
      const globalIdx = uploadedFiles[stateKey].length;
      uploadedFiles[stateKey].push({ file, url: null, name: file.name });
      const item = document.createElement("div");
      item.className = "preview-item";
      item.dataset.index = globalIdx;

      if (type === "image") {
        const reader = new FileReader();
        reader.onload = (e) => {
          item.innerHTML = `<img src="${e.target.result}" onclick="event.stopPropagation(); previewMedia('${stateKey}', ${globalIdx})" style="cursor:pointer;"><button class="preview-remove" onclick="removeMultiFile('${stateKey}', ${globalIdx}, '${previewId}')">&times;</button>`;
        };
        reader.readAsDataURL(file);
      } else {
        const isVideo = (type === "video");
        const tagClass = isVideo ? 'file-tag video-preview-tag' : 'file-tag';
        const tagClick = ` onclick="event.stopPropagation(); previewMedia('${stateKey}', ${globalIdx})"`;
        item.innerHTML = `<span class="${tagClass}"${tagClick}>${file.name}</span><button class="preview-remove" onclick="removeMultiFile('${stateKey}', ${globalIdx}, '${previewId}')">&times;</button>`;
      }
      preview.appendChild(item);
    });

    if (uploadedFiles[stateKey].length > 0) dropText.style.display = "none";
    input.value = "";
    updateCostEstimate();
  });
}

function removeMultiFile(stateKey, index, previewId) {
  uploadedFiles[stateKey].splice(index, 1);
  rebuildMultiPreview(stateKey, previewId);
  updateCostEstimate();
}

function rebuildMultiPreview(stateKey, previewId) {
  const preview = document.getElementById(previewId);
  const dropText = preview.closest(".file-drop").querySelector(".drop-text");
  preview.innerHTML = "";
  uploadedFiles[stateKey].forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "preview-item";
    div.dataset.index = idx;
    if (!item.file && item.url) {
      const displayUrl = item.previewUrl || item.url;
      const clickPreview = ` onclick="event.stopPropagation(); previewMedia('${stateKey}', ${idx})" style="cursor:pointer;"`;
      if (stateKey === "refImages" && displayUrl && !displayUrl.startsWith('asset://')) {
        div.innerHTML = `<img src="${escapeHtml(displayUrl)}"${clickPreview}><button class="preview-remove" onclick="removeMultiFile('${stateKey}', ${idx}, '${previewId}')">&times;</button>`;
      } else if (stateKey === "refVideos" && item.previewUrl && !item.previewUrl.startsWith('asset://')) {
        div.innerHTML = `<video src="${escapeHtml(item.previewUrl)}" muted style="max-height:80px;border-radius:6px;cursor:pointer;" onclick="event.stopPropagation(); previewMedia('${stateKey}', ${idx})"></video><button class="preview-remove" onclick="removeMultiFile('${stateKey}', ${idx}, '${previewId}')">&times;</button>`;
      } else {
        const isVideo = (stateKey === "refVideos");
        const tagClass = isVideo ? 'file-tag video-preview-tag' : 'file-tag';
        const tagClick = ` onclick="event.stopPropagation(); previewMedia('${stateKey}', ${idx})"`;
        div.innerHTML = `<span class="${tagClass}"${tagClick}>${escapeHtml(item.name)}</span><button class="preview-remove" onclick="removeMultiFile('${stateKey}', ${idx}, '${previewId}')">&times;</button>`;
      }
    } else if (item.file && item.file.type && item.file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        div.innerHTML = `<img src="${e.target.result}" onclick="event.stopPropagation(); previewMedia('${stateKey}', ${idx})" style="cursor:pointer;"><button class="preview-remove" onclick="removeMultiFile('${stateKey}', ${idx}, '${previewId}')">&times;</button>`;
      };
      reader.readAsDataURL(item.file);
    } else {
      const isVideo = (stateKey === "refVideos");
      const tagClass = isVideo ? 'file-tag video-preview-tag' : 'file-tag';
      const tagClick = ` onclick="event.stopPropagation(); previewMedia('${stateKey}', ${idx})"`;
      div.innerHTML = `<span class="${tagClass}"${tagClick}>${escapeHtml(item.name)}</span><button class="preview-remove" onclick="removeMultiFile('${stateKey}', ${idx}, '${previewId}')">&times;</button>`;
    }
    preview.appendChild(div);
  });
  dropText.style.display = uploadedFiles[stateKey].length > 0 ? "none" : "";
}

// ========== Upload to OSS ==========
async function uploadToOSS(file, maxRetries = 3) {
  console.log("Uploading file:", file.name, "size:", file.size);
  const formData = new FormData();
  formData.append("file", file);
  let lastError = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      const resp = await fetch("/api/upload", { method: "POST", body: formData, signal: controller.signal });
      clearTimeout(timeoutId);
      if (!resp.ok) {
        let errMsg = "文件上传失败";
        try { const err = await resp.json(); errMsg = err.error || errMsg; } catch (_) { errMsg = `文件上传失败 (HTTP ${resp.status})`; }
        throw new Error(errMsg);
      }
      const result = await resp.json();
      return result.url;
    } catch (err) {
      lastError = err;
      console.warn(`Upload attempt ${attempt}/${maxRetries} failed for ${file.name}:`, err.message);
      if (attempt < maxRetries) await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
  throw new Error(`上传失败 (${file.name}): ${lastError.message}`);
}

// ========== Cost Estimation & Budget ==========
function estimateCost() {
  const model = document.getElementById("model-select").value;
  const resolution = document.getElementById("resolution-select").value;
  let duration = parseInt(document.getElementById("duration-select").value);
  if (duration <= 0) duration = 5;
  const count = parseInt(document.getElementById("count-select").value) || 1;
  const hasVideo = uploadedFiles.refVideos.length > 0;
  const rate = (typeof TOKEN_RATES !== 'undefined' && TOKEN_RATES[resolution]) || 21600;
  const outputTokens = rate * duration;
  const inputTokens = hasVideo ? rate * duration : 0;
  const totalTokens = outputTokens + inputTokens;
  let unitPrice = 22;
  if (typeof PRICING_TABLE !== 'undefined') {
    const modelPrices = PRICING_TABLE[model] || {};
    const resPrices = modelPrices[resolution] || modelPrices["default"] || {};
    const priceKey = hasVideo ? "with_video" : "without_video";
    unitPrice = resPrices[priceKey] || 22;
  }
  return { cost: totalTokens / 1_000_000 * unitPrice * count, tokens: totalTokens, count };
}

function syncResolutionWithModel() {
  // Single page
  const modelSel = document.getElementById("model-select");
  const resSel = document.getElementById("resolution-select");
  if (modelSel && resSel) {
    const isFast = modelSel.value === "seedance-2.0-fast";
    const opt1080 = resSel.querySelector('option[value="1080p"]');
    if (opt1080) {
      opt1080.disabled = isFast;
      if (isFast && resSel.value === "1080p") resSel.value = "720p";
    }
  }
  // Batch page
  const batchModelSel = document.getElementById("batch-model-select");
  const batchResSel = document.getElementById("batch-resolution-select");
  if (batchModelSel && batchResSel) {
    const isFast = batchModelSel.value === "seedance-2.0-fast";
    const opt1080 = batchResSel.querySelector('option[value="1080p"]');
    if (opt1080) {
      opt1080.disabled = isFast;
      if (isFast && batchResSel.value === "1080p") batchResSel.value = "720p";
    }
  }
}

function updateCostEstimate() {
  const el = document.getElementById("cost-estimate");
  if (!el) return;
  const est = estimateCost();
  let text = "\u9884\u4f30: \u00a5" + est.cost.toFixed(2);
  if (est.count > 1) text += ` (\u00a5${(est.cost / est.count).toFixed(2)} x ${est.count})`;
  if (typeof CURRENT_ROLE !== 'undefined' && CURRENT_ROLE === 'user' && userBudgetData) {
    const remaining = userBudgetData.remaining || 0;
    if (est.cost > remaining) {
      text += ` | 剩余额度不足 (剩\u00a5${remaining.toFixed(2)})`;
      el.style.color = "var(--danger)";
    } else {
      el.style.color = "";
    }
  }
  el.textContent = text;
}

async function loadUserBudget(force) {
  if (typeof CURRENT_ROLE === 'undefined' || CURRENT_ROLE !== 'user') return;
  const now = Date.now();
  if (!force && _budgetLastFetch && (now - _budgetLastFetch) < 15000) return;
  _budgetLastFetch = now;
  try {
    const resp = await fetch('/api/user/budget');
    if (!resp.ok) return;
    const data = await resp.json();
    userBudgetData = data;
    renderBudgetDisplay();
    updateGenerateButtonState();
    updateCostEstimate();
  } catch (e) { console.error('Failed to load budget:', e); }
}

function renderBudgetDisplay() {
  const el = document.getElementById('budget-display');
  if (!el || !userBudgetData) return;
  const { budget, spent, remaining, frozen } = userBudgetData;
  el.textContent = `额度: \u00a5${remaining.toFixed(2)} / \u00a5${budget}`;
  el.title = `已用: \u00a5${spent.toFixed(2)}，冻结中: \u00a5${(frozen || 0).toFixed(2)}，剩余: \u00a5${remaining.toFixed(2)}`;
  if (remaining <= 0) {
    el.style.color = "var(--danger)";
  } else if (remaining < budget * 0.2) {
    el.style.color = "var(--warning)";
  } else {
    el.style.color = "";
  }
}

function updateGenerateButtonState() {
  const btn = document.getElementById("generate-btn");
  if (!btn) return;
  if (typeof CURRENT_ROLE !== 'undefined' && CURRENT_ROLE === 'user' && userBudgetData) {
    if (userBudgetData.remaining <= 0) {
      btn.disabled = true;
      btn.textContent = "额度已用完";
      return;
    }
  }
  btn.disabled = false;
  btn.textContent = "生成视频";
}

// ========== Generate Video (Single) ==========
function setupGenerateButton() {
  document.getElementById("generate-btn").addEventListener("click", generateVideo);
  document.getElementById("refresh-btn").addEventListener("click", loadTasks);
}

async function generateVideo() {
  const btn = document.getElementById("generate-btn");
  const mode = document.getElementById("mode-select").value;
  const prompt = document.getElementById("prompt-input").value.trim();
  const hasRefMedia = uploadedFiles.refImages.length > 0 || uploadedFiles.refVideos.length > 0;

  if (mode === "img2video-first" && !uploadedFiles.firstFrame) { showStatus("error", "请上传首帧图片"); return; }
  if (mode === "img2video-firstlast" && (!uploadedFiles.firstFrame || !uploadedFiles.lastFrame)) { showStatus("error", "请上传首帧和尾帧图片"); return; }
  if (mode === "multimodal" && !hasRefMedia) { showStatus("error", "多模态模式至少需要上传一张参考图片或一个参考视频"); return; }
  if (!prompt && mode === "text2video") { showStatus("error", "请输入提示词"); return; }

  const count = parseInt(document.getElementById("count-select").value) || 1;
  btn.disabled = true;
  showStatus("info", "正在上传文件...");

  try {
    const images = [], videos = [], audios = [];
    if (uploadedFiles.firstFrame) {
      let url = uploadedFiles.firstFrame.url;
      if (!url && uploadedFiles.firstFrame.file) url = await uploadToOSS(uploadedFiles.firstFrame.file);
      if (url) images.push({ url, role: "first_frame" });
    }
    if (uploadedFiles.lastFrame) {
      let url = uploadedFiles.lastFrame.url;
      if (!url && uploadedFiles.lastFrame.file) url = await uploadToOSS(uploadedFiles.lastFrame.file);
      if (url) images.push({ url, role: "last_frame" });
    }
    for (const img of uploadedFiles.refImages) {
      let url = img.url;
      if (!url && img.file) url = await uploadToOSS(img.file);
      if (url) images.push({ url, role: "reference_image" });
    }
    for (const vid of uploadedFiles.refVideos) {
      let url = vid.url;
      if (!url && vid.file) url = await uploadToOSS(vid.file);
      if (url) videos.push({ url, role: "reference_video" });
    }
    for (const aud of uploadedFiles.refAudios) {
      let url = aud.url;
      if (!url && aud.file) url = await uploadToOSS(aud.file);
      if (url) audios.push({ url, role: "reference_audio" });
    }

    const body = {
      model: document.getElementById("model-select").value,
      mode, prompt, images, videos, audios,
      resolution: document.getElementById("resolution-select").value,
      ratio: document.getElementById("ratio-select").value,
      duration: parseInt(document.getElementById("duration-select").value),
      generate_audio: document.getElementById("audio-select").value === "true",
      web_search: document.getElementById("web-search-check").checked && mode === "text2video",
    };

    let successCount = 0, lastTaskId = null;
    for (let i = 0; i < count; i++) {
      if (count > 1) showStatus("info", `正在提交任务 ${i + 1}/${count}...`);
      const resp = await fetch("/api/create-task", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (resp.ok) { const result = await resp.json(); lastTaskId = result.id; successCount++; }
      if (i < count - 1) await new Promise(r => setTimeout(r, 300));
    }

    if (count === 1) showStatus("success", `任务已提交! ID: ${lastTaskId}`);
    else showStatus("success", `已成功提交 ${successCount} 个任务!`);

    btn.disabled = false;
    loadTasks();
    if (typeof CURRENT_ROLE !== 'undefined' && CURRENT_ROLE === 'user') loadUserBudget(true);
  } catch (err) {
    showStatus("error", friendlyError(err.message));
    btn.disabled = false;
  }
}

// ========== Load Tasks ==========
const debouncedLoadTasks = debounce(async () => {
  try {
    const params = new URLSearchParams();
    if (!adminShowAll) params.set('mine', '1');
    params.set('per_page', String(TASKS_PER_PAGE));
    params.set('page', String(currentPage));
    const url = `/api/tasks?${params.toString()}`;
    const resp = await fetch(url);
    if (resp.status === 429) {
      console.warn("Rate limited, will retry later");
      setTimeout(schedulePolling, 10000);
      return;
    }
    const data = await resp.json();
    cachedTasks = data.tasks || [];
    totalTasks = data.total || 0;
    totalPages = data.total_pages || 1;
    deletedSuccessTotal = data.deleted_success_total || 0;
    deletedSuccessByUser = data.deleted_success_by_user || {};
    userCounts = data.user_counts || {};
    renderCurrentTasks();
    schedulePolling();
    if (typeof CURRENT_ROLE !== 'undefined' && CURRENT_ROLE === 'user') loadUserBudget();
  } catch (err) {
    console.error("Failed to load tasks:", err);
    schedulePolling();
  }
}, 500);

function loadTasks() { debouncedLoadTasks(); }

function schedulePolling() {
  if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
  if (document.hidden) return;
  const hasRunning = cachedTasks.some(t => ["pending", "queued", "running", "downloading"].includes(t.status));
  if (hasRunning) {
    prevHadRunning = true;
    pollTimer = setTimeout(loadTasks, 5000);
  } else if (prevHadRunning) {
    prevHadRunning = false;
    pollTimer = setTimeout(loadTasks, 2000);
  }
}

function startElapsedTimer() {
  if (elapsedTimer) clearInterval(elapsedTimer);
  elapsedTimer = setInterval(() => {
    const now = Math.floor(Date.now() / 1000);
    const els = document.querySelectorAll(".gen-elapsed[data-created]");
    els.forEach(el => {
      const created = parseInt(el.dataset.created, 10);
      const elapsed = now - created;
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      el.textContent = mins > 0 ? `已用时 ${mins}分${secs}秒` : `已用时 ${secs}秒`;
    });
  }, 1000);
}

function isVideoPlaying() {
  if (document.fullscreenElement || document.webkitFullscreenElement) return true;
  if (loadingVideoTasks.size > 0) return true;
  return false;
}

// ========== Render Tasks ==========
function renderCurrentTasks() {
  if (isVideoPlaying()) {
    const displayTasks = (adminShowAll && adminFilterUser)
      ? cachedTasks.filter(t => t.owner_username === adminFilterUser)
      : cachedTasks;
    document.getElementById("batch-count").textContent = displayTasks.filter(t => t.batch_id).length;
    document.getElementById("single-count").textContent = displayTasks.filter(t => !t.batch_id).length;
    return;
  }

  let displayTasks = cachedTasks;
  if (adminShowAll && adminFilterUser) {
    displayTasks = cachedTasks.filter(t => t.owner_username === adminFilterUser);
  }

  updateAdminUserFilter();

  const batchTasks = displayTasks.filter(t => t.batch_id);
  const singleTasks = displayTasks.filter(t => !t.batch_id);

  document.getElementById("batch-count").textContent = batchTasks.length;
  document.getElementById("single-count").textContent = singleTasks.length;

  const batchSection = document.getElementById("batch-section");
  const singleSection = document.getElementById("single-section");
  const divider = document.getElementById("section-divider");
  const globalEmpty = document.getElementById("global-empty");

  if (activeTab !== "single" && activeTab !== "batch") {
    return;
  }

  const hasBatch = batchTasks.length > 0;
  const hasSingle = singleTasks.length > 0;
  const showBatchOnly = activeTab === "batch";
  const showSingleOnly = activeTab === "single";

  if (!hasBatch && !hasSingle) {
    batchSection.style.display = "none";
    singleSection.style.display = "none";
    divider.style.display = "none";
    globalEmpty.style.display = "block";
  } else {
    globalEmpty.style.display = "none";

    // Batch section
    if (hasBatch && !showSingleOnly) {
      batchSection.style.display = "block";
      renderBatchFolders(batchTasks);
    } else {
      batchSection.style.display = "none";
      document.getElementById("batch-folders-list").innerHTML = '';
    }

    // Single section
    if (hasSingle && !showBatchOnly) {
      singleSection.style.display = "block";
      renderTasks(singleTasks);
    } else {
      singleSection.style.display = "none";
      document.getElementById("video-list").innerHTML = '<div class="empty-state">暂无单个任务</div>';
    }

    divider.style.display = "none";
  }

  // Pagination
  renderPagination();

  // Setup lazy loading
  setupVideoLazyLoading();
  document.querySelectorAll('video[data-src]').forEach(video => {
    if (videoObserver) videoObserver.observe(video);
  });

  // Elapsed timer
  const hasRunning = cachedTasks.some(t => ["pending", "queued", "running", "downloading"].includes(t.status));
  if (hasRunning) startElapsedTimer();
  else if (elapsedTimer) { clearInterval(elapsedTimer); elapsedTimer = null; }
}

function renderPagination() {
  const container = document.getElementById("pagination-container");
  if (!container) return;
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = '<div class="pagination">';
  html += `<button class="page-btn" ${currentPage <= 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">上一页</button>`;

  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage < maxButtons - 1) startPage = Math.max(1, endPage - maxButtons + 1);

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-btn${i === currentPage ? ' active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" ${currentPage >= totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">下一页</button>`;
  html += '</div>';
  container.innerHTML = html;
}

function goToPage(page) {
  if (page < 1 || page > totalPages || page === currentPage) return;
  currentPage = page;
  loadTasks();
}

function resetPagination() {
  currentPage = 1;
}

// ========== Render Batch Folders ==========
function renderBatchFolders(batchTasks) {
  const list = document.getElementById("batch-folders-list");
  const batchEmpty = document.getElementById("batch-empty");

  if (!batchTasks.length) {
    list.innerHTML = '';
    if (batchEmpty) batchEmpty.style.display = "block";
    return;
  }
  if (batchEmpty) batchEmpty.style.display = "none";

  const folders = {};
  for (const task of batchTasks) {
    const bid = task.batch_id;
    if (!folders[bid]) {
      folders[bid] = {
        name: task.batch_folder_name || `批量任务 ${bid.slice(-6)}`,
        tasks: [],
        createdAt: task.batch_created_at || new Date(task.created_at * 1000).toISOString(),
      };
    }
    folders[bid].tasks.push(task);
  }

  const sortedFolders = Object.entries(folders).sort((a, b) => {
    return new Date(b[1].createdAt) - new Date(a[1].createdAt);
  });

  let html = '';
  for (const [bid, folder] of sortedFolders) {
    const tasks = folder.tasks;
    const total = tasks.length;
    const done = tasks.filter(t => t.status === "succeeded").length;
    const failed = tasks.filter(t => ["failed", "expired", "cancelled", "timeout"].includes(t.status)).length;
    const running = tasks.filter(t => ["pending", "queued", "running", "downloading"].includes(t.status)).length;
    const percent = total > 0 ? Math.round(done / total * 100) : 0;
    const isExpanded = batchFolderExpanded[bid] || false;

    html += `
      <div class="batch-folder-item" data-batch-id="${bid}">
        <div class="batch-folder-header" onclick="toggleBatchFolder('${bid}')">
          <div style="flex:1">
            <div class="batch-folder-name">${escapeHtml(folder.name)}</div>
            <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">${new Date(folder.createdAt).toLocaleString('zh-CN')}</div>
          </div>
          <div class="batch-folder-meta">
            <span>${done}/${total} 完成</span>
            <div class="batch-folder-progress">
              <div class="batch-folder-progress-fill" style="width:${percent}%"></div>
            </div>
            ${failed > 0 ? `<span style="color:var(--danger)">${failed} 失败</span>` : ''}
            ${running > 0 ? `<span style="color:var(--warning)">${running} 进行中</span>` : ''}
            <button class="btn-delete-folder-simple" data-delete-batch="${bid}" title="删除整个文件夹">&times;</button>
          </div>
        </div>
        <div class="batch-folder-toolbar">
          <label class="batch-select-all"><input type="checkbox" onchange="toggleSelectAll('${bid}', this.checked)"> 全选</label>
          <button class="btn-batch-delete-selected" onclick="deleteSelectedTasks('${bid}')">删除选中</button>
        </div>
        <div class="batch-folder-tasks ${isExpanded ? 'expanded' : ''}" id="batch-folder-tasks-${bid}">
          ${tasks.map(task => renderTaskCard(task)).join('')}
        </div>
      </div>`;
  }

  list.innerHTML = html;
  list.style.display = "block";
}

// ========== Render Single Tasks ==========
function renderTasks(tasks) {
  const container = document.getElementById("video-list");
  for (const taskId in openEdits) {
    const editEl = document.getElementById(`edit-${taskId}`);
    if (editEl) {
      const ta = editEl.querySelector("textarea");
      if (ta) openEdits[taskId].text = ta.value;
    }
  }
  if (!tasks || tasks.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无单个任务</div>';
    prevSingleTaskStatuses = {};
    return;
  }
  container.innerHTML = tasks.map(task => renderTaskCard(task)).join("");
  tasks.forEach(t => { prevSingleTaskStatuses[t.id] = t.status; });
}

// ========== Render Task Card ==========
function renderTaskCard(task) {
  const statusLabels = {
    pending: "等待中", queued: "排队中", running: "生成中",
    succeeded: "已完成", failed: "失败", expired: "已过期",
    cancelled: "已取消", downloading: "下载中", timeout: "查询超时",
  };
  const statusLabel = statusLabels[task.status] || task.status;
  const time = new Date(task.created_at * 1000).toLocaleString("zh-CN");
  const isCompleted = task.status === "succeeded";
  const isFailed = ["failed", "expired", "cancelled", "timeout"].includes(task.status);
  const isRunning = ["pending", "queued", "running", "downloading"].includes(task.status);

  let videoHtml;
  if (isCompleted) {
    const thumbnailUrl = task.thumbnail_path ? `/api/thumbnail/${task.id}` : null;
    const hasThumbnail = !!thumbnailUrl;
    const posterUrl = hasThumbnail ? thumbnailUrl : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 16 9'%3E%3Crect fill='%23222' width='100%25' height='100%25'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-size='14'%3E点击播放%3C/text%3E%3C/svg%3E";
    videoHtml = `
      <div class="video-thumbnail-preview" onclick="playVideo(this, '${task.id}')" style="cursor:pointer;position:relative;width:100%;height:100%;background:#000;display:flex;align-items:center;justify-content:center;">
        <img src="${posterUrl}" style="max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;" onerror="this.style.display='none'">
        <div class="play-overlay" style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.3);transition:background 0.2s;">
          <div class="play-button" style="width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.3);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M8 5V19L19 12L8 5Z" fill="#333"/></svg>
          </div>
        </div>
      </div>
      <video controls preload="none" data-src="/api/video/${task.id}" poster="${posterUrl}" style="display:none;background:#000;"></video>`;
  } else if (isRunning) {
    const elapsed = Math.floor(Date.now() / 1000) - task.created_at;
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const elapsedStr = mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`;
    const steps = [
      { key: "pending", label: "等待" }, { key: "queued", label: "排队" },
      { key: "running", label: "生成" }, { key: "downloading", label: "下载" },
    ];
    const currentIdx = steps.findIndex(s => s.key === task.status);
    const stepsHtml = steps.map((s, i) => {
      let cls = "step-pending";
      if (i < currentIdx) cls = "step-done";
      else if (i === currentIdx) cls = "step-active";
      return `<span class="gen-step ${cls}">${s.label}</span>`;
    }).join("");
    videoHtml = `
      <div class="video-placeholder gen-status">
        <div class="spinner"></div>
        <div class="gen-steps">${stepsHtml}</div>
        <div class="gen-status-text">${statusLabel}...</div>
        <div class="gen-elapsed" data-created="${task.created_at}">已用时 ${elapsedStr}</div>
      </div>`;
  } else if (isFailed) {
    videoHtml = `<div class="video-placeholder">${task.error ? friendlyError(task.error) : statusLabel}</div>`;
  } else {
    videoHtml = `<div class="video-placeholder">${statusLabel}</div>`;
  }

  const promptDisplay = task.prompt ? escapeHtml(task.prompt) : '<i style="opacity:0.5">无提示词</i>';
  const isEditing = openEdits.hasOwnProperty(task.id);
  const editState = isEditing ? openEdits[task.id] : null;
  const editText = editState ? editState.text : (task.prompt || "");

  let mediaHtml = '';
  if (isEditing && editState.media) {
    const m = editState.media;
    let rows = '';
    if (m.images.length > 0) {
      const items = m.images.map((img, i) =>
        `<div class="edit-media-item">
          <img src="${escapeHtml(img.preview || img.url)}" title="${escapeHtml(img.name)}">
          <span class="edit-media-role">${escapeHtml(roleLabel(img.role))}</span>
          <button class="edit-media-remove" onclick="editRemoveMedia('${task.id}','images',${i})">&times;</button>
        </div>`
      ).join("");
      rows += `<div class="edit-media-row"><span class="edit-media-label">图片</span>${items}</div>`;
    }
    if (m.videos.length > 0) {
      const items = m.videos.map((vid, i) =>
        `<div class="edit-media-item">
          <span class="file-tag">${escapeHtml(vid.name)}</span>
          <button class="edit-media-remove" onclick="editRemoveMedia('${task.id}','videos',${i})">&times;</button>
        </div>`
      ).join("");
      rows += `<div class="edit-media-row"><span class="edit-media-label">视频</span>${items}</div>`;
    }
    if (m.audios.length > 0) {
      const items = m.audios.map((aud, i) =>
        `<div class="edit-media-item">
          <span class="file-tag">${escapeHtml(aud.name)}</span>
          <button class="edit-media-remove" onclick="editRemoveMedia('${task.id}','audios',${i})">&times;</button>
        </div>`
      ).join("");
      rows += `<div class="edit-media-row"><span class="edit-media-label">音频</span>${items}</div>`;
    }
    const addBtns = `
      <div class="edit-media-add">
        <button onclick="editAddMediaClick('${task.id}','images')">+ 图片</button>
        <button onclick="editAddMediaClick('${task.id}','videos')">+ 视频</button>
        <button onclick="editAddMediaClick('${task.id}','audios')">+ 音频</button>
      </div>
      <input type="file" id="edit-file-images-${task.id}" accept="image/*" multiple hidden onchange="handleEditMediaFile('${task.id}','images',this)">
      <input type="file" id="edit-file-videos-${task.id}" accept="video/mp4,video/quicktime" multiple hidden onchange="handleEditMediaFile('${task.id}','videos',this)">
      <input type="file" id="edit-file-audios-${task.id}" accept="audio/wav,audio/mp3,audio/mpeg" multiple hidden onchange="handleEditMediaFile('${task.id}','audios',this)">
    `;
    mediaHtml = `<div class="edit-media">${rows}${addBtns}</div>`;
  }

  const editSection = isCompleted || isFailed ? `
    <div class="card-edit ${isEditing ? 'active' : ''}" id="edit-${task.id}">
      <textarea rows="3">${escapeHtml(editText)}</textarea>
      ${mediaHtml}
      <div class="card-actions">
        <button onclick="cancelEdit('${task.id}')">取消</button>
        <button class="btn-primary" onclick="regenerateTask('${task.id}', this)">重新生成</button>
      </div>
    </div>
  ` : "";

  const actionsHtml = (() => {
    if (isCompleted) {
      return `
        <button onclick="editTaskInPanel('${task.id}')">重新编辑</button>
        <button class="btn-primary" onclick="regenerateTask('${task.id}', this)">重新生成</button>
        <button onclick="downloadVideo('${task.id}')">下载</button>
        <button class="btn-danger" onclick="deleteTask('${task.id}')">删除</button>
      `;
    }
    if (isFailed) {
      return `
        <button onclick="editTaskInPanel('${task.id}')">重新编辑</button>
        <button class="btn-primary" onclick="regenerateTask('${task.id}', this)">重试</button>
        <button class="btn-danger" onclick="deleteTask('${task.id}')">删除</button>
      `;
    }
    return `<button class="btn-danger" onclick="deleteTask('${task.id}')">取消</button>`;
  })();

  const batchCheckbox = task.batch_id ? `<input type="checkbox" class="batch-task-checkbox" data-task-id="${task.id}" data-batch-id="${task.batch_id}">` : '';
  const costBadge = task.cost_yuan != null ? `<span class="card-cost-badge">${formatTokens(task.completion_tokens)} | \u00a5${formatCost(task.cost_yuan)}</span>` : "";

  return `
    <div class="video-card" id="card-${task.id}">
      ${batchCheckbox}
      <div class="video-wrapper">${videoHtml}</div>
      <div class="card-body">
        <div class="card-meta">
          <span class="card-model">${escapeHtml(task.model)}</span>${task.batch_id ? `<span class="batch-badge">批量 ${(task.batch_index || 0) + 1}/${task.batch_total || "?"}</span>` : ""}
          <span class="status-badge ${task.status}">${statusLabel}</span>${task.owner_username ? `<span class="task-owner-badge">${escapeHtml(task.owner_username)}</span>` : ""}${costBadge}
          <span class="card-time">${time}</span>
        </div>
        <div class="card-prompt">${promptDisplay}</div>
        ${editSection}
        <div class="card-actions">${actionsHtml}</div>
      </div>
    </div>
  `;
}

// ========== Task Actions ==========
function toggleEdit(taskId) {
  if (openEdits[taskId]) {
    delete openEdits[taskId];
  } else {
    const task = cachedTasks.find(t => t.id === taskId);
    if (!task) return;
    openEdits[taskId] = { text: task.prompt || "", media: extractMediaFromTask(task) };
  }
  renderCurrentTasks();
}

function cancelEdit(taskId) {
  delete openEdits[taskId];
  renderCurrentTasks();
}

function editRemoveMedia(taskId, mediaType, index) {
  if (!openEdits[taskId] || !openEdits[taskId].media) return;
  openEdits[taskId].media[mediaType].splice(index, 1);
  renderCurrentTasks();
}

function editAddMediaClick(taskId, mediaType) {
  document.getElementById(`edit-file-${mediaType}-${taskId}`).click();
}

function handleEditMediaFile(taskId, mediaType, input) {
  if (!openEdits[taskId]) return;
  const files = Array.from(input.files);
  for (const file of files) {
    const role = mediaType === 'images' ? 'reference_image' : mediaType === 'videos' ? 'reference_video' : 'reference_audio';
    openEdits[taskId].media[mediaType].push({ file, url: null, role, name: file.name, preview: null });
  }
  input.value = '';
  renderCurrentTasks();
}

async function regenerateTask(taskId, btnEl) {
  const task = cachedTasks.find(t => t.id === taskId);
  if (!task) return;
  const originalText = btnEl ? btnEl.textContent : "";
  if (btnEl) { btnEl.disabled = true; btnEl.textContent = "提交中..."; }

  try {
    const editState = openEdits[taskId];
    const prompt = editState ? editState.text : task.prompt;
    const media = editState ? editState.media : extractMediaFromTask(task);
    const images = [], videos = [], audios = [];

    for (let i = 0; i < media.images.length; i++) {
      const img = media.images[i];
      if (img.url) { images.push({ url: img.url, role: img.role }); }
      else if (img.file) {
        if (btnEl) btnEl.textContent = `上传图片 ${i + 1}/${media.images.length}...`;
        const url = await uploadToOSS(img.file);
        images.push({ url, role: img.role });
      }
    }
    for (let i = 0; i < media.videos.length; i++) {
      const vid = media.videos[i];
      if (vid.url) { videos.push({ url: vid.url, role: vid.role }); }
      else if (vid.file) {
        if (btnEl) btnEl.textContent = `上传视频 ${i + 1}/${media.videos.length}...`;
        const url = await uploadToOSS(vid.file);
        videos.push({ url, role: vid.role });
      }
    }
    for (let i = 0; i < media.audios.length; i++) {
      const aud = media.audios[i];
      if (aud.url) { audios.push({ url: aud.url, role: aud.role }); }
      else if (aud.file) {
        if (btnEl) btnEl.textContent = `上传音频 ${i + 1}/${media.audios.length}...`;
        const url = await uploadToOSS(aud.file);
        audios.push({ url, role: aud.role });
      }
    }

    const body = {
      model: task.model, mode: task.mode || "text2video", prompt, images, videos, audios,
      resolution: (task.settings || {}).resolution || "720p",
      ratio: (task.settings || {}).ratio || "9:16",
      duration: (task.settings || {}).duration || 5,
      generate_audio: (task.settings || {}).generate_audio !== false,
    };

    const resp = await fetch("/api/create-task", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await resp.json();
    if (!resp.ok) throw new Error(result.error || "提交失败");

    await fetch(`/api/delete-task/${taskId}`, { method: "DELETE" });
    delete openEdits[taskId];
    showStatus("success", `任务已重新提交! ID: ${result.seedance_task_id || result.id}`);
    loadTasks();
    if (btnEl) { btnEl.textContent = "已提交"; setTimeout(() => { btnEl.textContent = originalText; btnEl.disabled = false; }, 2000); }
  } catch (err) {
    showStatus("error", friendlyError(err.message));
    if (btnEl) { btnEl.textContent = "失败"; setTimeout(() => { btnEl.textContent = originalText; btnEl.disabled = false; }, 2000); }
  }
}

async function deleteTask(taskId) {
  if (!confirm("确定要删除这个任务吗？")) return;
  try {
    await fetch(`/api/delete-task/${taskId}`, { method: "DELETE" });
    loadTasks();
  } catch (err) { console.error("Delete failed:", err); }
}

// ========== Edit Task In Panel ==========
function editTaskInPanel(taskId) {
  const task = cachedTasks.find(t => t.id === taskId);
  if (!task) { showStatus("error", "任务未找到"); return; }

  // Switch to single page
  document.querySelectorAll(".sidebar-item").forEach(b => b.classList.remove("active"));
  const singleBtn = document.querySelector('.sidebar-item[data-page="single"]');
  if (singleBtn) singleBtn.classList.add("active");
  activeTab = "single";
  document.querySelectorAll(".page-content").forEach(p => p.classList.remove("active"));
  document.getElementById("page-single").classList.add("active");

  // Show right panel sections
  const singleSection = document.getElementById("single-section");
  const batchSection = document.getElementById("batch-section");
  const mosaicSection = document.getElementById("mosaic-section");
  const assetSection = document.getElementById("asset-section");
  const tplShortcuts = document.getElementById("template-shortcuts");
  const panelHeader = document.querySelector(".panel-right-header");
  const paginationContainer = document.getElementById("pagination-container");
  if (singleSection) singleSection.style.display = "block";
  if (batchSection) batchSection.style.display = "none";
  if (mosaicSection) mosaicSection.style.display = "none";
  if (assetSection) assetSection.style.display = "none";
  if (tplShortcuts) tplShortcuts.style.display = "none";
  if (panelHeader) panelHeader.style.display = "";
  if (paginationContainer) paginationContainer.style.display = "";

  // Set model
  const modelSelect = document.getElementById("model-select");
  if (task.model && modelSelect) modelSelect.value = task.model;

  // Set mode
  const modeSelect = document.getElementById("mode-select");
  const mode = task.mode || "text2video";
  if (modeSelect) modeSelect.value = mode;

  // Update mode tabs
  document.querySelectorAll(".mode-tab-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.mode === mode);
  });

  // Show upload areas based on mode
  document.querySelectorAll(".upload-area").forEach(el => el.style.display = "none");
  document.getElementById("web-search-section").style.display = "none";
  switch (mode) {
    case "text2video":
      document.getElementById("web-search-section").style.display = "block";
      break;
    case "img2video-first":
      document.getElementById("upload-area-first").style.display = "block";
      break;
    case "img2video-firstlast":
      document.getElementById("upload-area-first").style.display = "block";
      document.getElementById("upload-area-last").style.display = "block";
      break;
    case "multimodal":
      document.getElementById("upload-area-ref-images").style.display = "block";
      document.getElementById("upload-area-ref-videos").style.display = "block";
      document.getElementById("upload-area-ref-audios").style.display = "block";
      break;
  }

  // Set prompt
  document.getElementById("prompt-input").value = task.prompt || "";
  document.getElementById("char-count").textContent = (task.prompt || "").length;

  // Set settings
  const settings = task.settings || {};
  if (settings.resolution) document.getElementById("resolution-select").value = settings.resolution;
  if (settings.ratio) document.getElementById("ratio-select").value = settings.ratio;
  if (settings.duration) document.getElementById("duration-select").value = String(settings.duration);
  if (settings.generate_audio !== undefined) document.getElementById("audio-select").value = String(settings.generate_audio);

  // Pre-populate media from task
  resetUploadedFiles();
  const media = extractMediaFromTask(task);
  for (const img of media.images) {
    if (img.role === "first_frame") {
      uploadedFiles.firstFrame = { file: null, url: img.url, previewUrl: img.preview, name: img.name };
      const preview = document.getElementById("first-frame-preview");
      if (preview && img.preview && !img.preview.startsWith('asset://')) {
        preview.innerHTML = `<img src="${escapeHtml(img.preview)}" style="cursor:pointer;">`;
        preview.closest(".file-drop").querySelector(".drop-text").style.display = "none";
      }
    } else if (img.role === "last_frame") {
      uploadedFiles.lastFrame = { file: null, url: img.url, previewUrl: img.preview, name: img.name };
      const preview = document.getElementById("last-frame-preview");
      if (preview && img.preview && !img.preview.startsWith('asset://')) {
        preview.innerHTML = `<img src="${escapeHtml(img.preview)}" style="cursor:pointer;">`;
        preview.closest(".file-drop").querySelector(".drop-text").style.display = "none";
      }
    } else {
      uploadedFiles.refImages.push({ file: null, url: img.url, previewUrl: img.preview, name: img.name });
    }
  }
  for (const vid of media.videos) {
    uploadedFiles.refVideos.push({ file: null, url: vid.url, name: vid.name });
  }
  for (const aud of media.audios) {
    uploadedFiles.refAudios.push({ file: null, url: aud.url, name: aud.name });
  }

  rebuildMultiPreview("refImages", "ref-images-preview");
  rebuildMultiPreview("refVideos", "ref-videos-preview");
  rebuildMultiPreview("refAudios", "ref-audios-preview");
  updateCostEstimate();

  showStatus("info", "已加载任务参数，修改后点击\"生成视频\"");
}

// ========== Video Playback ==========
function playVideo(thumbnailEl, taskId) {
  loadingVideoTasks.add(taskId);
  const container = thumbnailEl.parentElement;
  const video = container.querySelector('video');
  if (video.dataset.src) {
    video.src = video.dataset.src;
    video.removeAttribute('data-src');
  } else if (!video.src) {
    video.src = '/api/video/' + taskId;
  }
  thumbnailEl.style.display = 'none';
  video.style.display = 'block';
  video.load();
  video.play().catch(e => console.log('Auto-play prevented:', e));

  function clearProtection() { loadingVideoTasks.delete(taskId); }
  video.addEventListener('ended', clearProtection, { once: true });
  video.addEventListener('pause', clearProtection, { once: true });
  video.addEventListener('error', clearProtection, { once: true });
  setTimeout(clearProtection, 15000);
}

function downloadVideo(taskId) {
  const a = document.createElement('a');
  a.href = '/api/video/' + taskId + '/download';
  a.download = taskId + '.mp4';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function previewMedia(stateKey, index) {
  let item;
  if (stateKey === 'firstFrame' || stateKey === 'lastFrame') { item = uploadedFiles[stateKey]; }
  else { item = uploadedFiles[stateKey] && uploadedFiles[stateKey][index]; }
  if (!item) return;

  let src = null, isObjectUrl = false, mediaType = 'image';
  if (item.file) {
    src = URL.createObjectURL(item.file);
    isObjectUrl = true;
    if (item.file.type.startsWith('video/')) mediaType = 'video';
    else if (item.file.type.startsWith('audio/')) mediaType = 'audio';
  } else if (item.previewUrl) {
    src = item.previewUrl;
    if (stateKey === 'refVideos') mediaType = 'video';
    else if (stateKey === 'refAudios') mediaType = 'audio';
  } else if (item.url) {
    src = item.url;
    if (stateKey === 'refVideos') mediaType = 'video';
    else if (stateKey === 'refAudios') mediaType = 'audio';
  }
  if (!src) return;

  const existing = document.querySelector('.video-preview-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'video-preview-overlay';
  let contentHtml = '';
  if (mediaType === 'video') contentHtml = `<video controls autoplay src="${src}" style="max-width:90vw;max-height:80vh;border-radius:8px;"></video>`;
  else if (mediaType === 'audio') contentHtml = `<audio controls autoplay src="${src}" style="width:400px;"></audio>`;
  else contentHtml = `<img src="${src}" style="max-width:90vw;max-height:80vh;border-radius:8px;object-fit:contain;">`;

  overlay.innerHTML = `<div class="video-preview-modal"><button class="vp-close">&times;</button>${contentHtml}<div class="vp-name">${escapeHtml(item.name || '')}</div></div>`;
  document.body.appendChild(overlay);

  function closePreview() {
    const vid = overlay.querySelector('video');
    if (vid) { vid.pause(); vid.removeAttribute('src'); vid.load(); }
    if (isObjectUrl) URL.revokeObjectURL(src);
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e) { if (e.key === 'Escape') closePreview(); }
  document.addEventListener('keydown', onKey);
  overlay.querySelector('.vp-close').addEventListener('click', closePreview);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closePreview(); });
}

// ========== Batch Folder Management ==========
function toggleBatchFolder(batchId) {
  batchFolderExpanded[batchId] = !batchFolderExpanded[batchId];
  const el = document.getElementById(`batch-folder-tasks-${batchId}`);
  if (el) el.classList.toggle('expanded');
}

function toggleAllBatchFolders() {
  const list = document.getElementById("batch-folders-list");
  const isHidden = list.style.display === "none";
  list.style.display = isHidden ? "block" : "none";
  document.getElementById("toggle-batch-folders").textContent = isHidden ? "收起" : "展开全部";
}

function toggleSelectAll(batchId, checked) {
  const folder = document.querySelector(`[data-batch-id="${batchId}"]`);
  if (!folder) return;
  const checkboxes = folder.querySelectorAll('.batch-task-checkbox');
  checkboxes.forEach(cb => cb.checked = checked);
}

async function deleteSelectedTasks(batchId) {
  const folder = document.querySelector(`[data-batch-id="${batchId}"]`);
  if (!folder) return;
  const checkboxes = folder.querySelectorAll('.batch-task-checkbox:checked');
  const taskIds = Array.from(checkboxes).map(cb => cb.getAttribute('data-task-id'));
  if (taskIds.length === 0) { alert("请先勾选要删除的任务"); return; }
  if (!confirm(`确定要删除选中的 ${taskIds.length} 个任务吗？`)) return;

  let deleted = 0, failed = 0;
  for (const id of taskIds) {
    try {
      const r = await fetch(`/api/delete-task/${id}`, { method: "DELETE" });
      if (r.ok) deleted++; else failed++;
    } catch (_) { failed++; }
  }
  if (failed > 0) alert(`已删除 ${deleted} 个任务，${failed} 个失败`);
  else alert(`已删除 ${deleted} 个任务`);
  loadTasks();
}

async function deleteFolderById(batchId) {
  if (!confirm("确定要删除整个任务夹吗？")) return;
  try {
    const resp = await fetch(`/api/delete-batch/${batchId}`, { method: "DELETE" });
    const result = await resp.json();
    if (resp.ok) {
      loadTasks();
      alert(`已删除 ${result.removed || 0} 个任务`);
    } else {
      alert(result.error || "删除失败");
    }
  } catch (e) { alert("网络错误"); }
}

// ========== Sidebar / Tab Switching ==========
function setupSidebar() {
  document.querySelectorAll('.sidebar-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const page = btn.dataset.page;
      activeTab = page;

      // Left panel
      document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
      const target = document.getElementById('page-' + page) || document.getElementById(page + '-panel');
      if (target) target.classList.add('active');

      // Right panel sections
      const batchSection = document.getElementById('batch-section');
      const singleSection = document.getElementById('single-section');
      const sectionDivider = document.getElementById('section-divider');
      const mosaicSection = document.getElementById('mosaic-section');
      const assetSection = document.getElementById('asset-section');
      const globalEmpty = document.getElementById('global-empty');
      const panelHeader = document.querySelector('.panel-right-header');
      const tplShortcuts = document.getElementById('template-shortcuts');
      const paginationContainer = document.getElementById('pagination-container');

      if (page === 'single') {
        if (batchSection) batchSection.style.display = 'none';
        if (sectionDivider) sectionDivider.style.display = 'none';
        if (singleSection) singleSection.style.display = 'block';
        if (mosaicSection) mosaicSection.style.display = 'none';
        if (assetSection) assetSection.style.display = 'none';
        if (panelHeader) panelHeader.style.display = '';
        if (tplShortcuts) tplShortcuts.style.display = 'none';
        if (paginationContainer) paginationContainer.style.display = '';
        loadTasks();
      } else if (page === 'batch') {
        if (singleSection) singleSection.style.display = 'none';
        if (sectionDivider) sectionDivider.style.display = 'none';
        if (batchSection) batchSection.style.display = 'block';
        if (mosaicSection) mosaicSection.style.display = 'none';
        if (assetSection) assetSection.style.display = 'none';
        if (panelHeader) panelHeader.style.display = '';
        if (tplShortcuts) tplShortcuts.style.display = 'block';
        if (paginationContainer) paginationContainer.style.display = 'none';
        loadTasks();
      } else if (page === 'mosaic') {
        if (singleSection) singleSection.style.display = 'none';
        if (batchSection) batchSection.style.display = 'none';
        if (sectionDivider) sectionDivider.style.display = 'none';
        if (mosaicSection) mosaicSection.style.display = 'block';
        if (assetSection) assetSection.style.display = 'none';
        if (globalEmpty) globalEmpty.style.display = 'none';
        if (panelHeader) panelHeader.style.display = 'none';
        if (tplShortcuts) tplShortcuts.style.display = 'none';
        if (paginationContainer) paginationContainer.style.display = 'none';
      } else if (page === 'assets') {
        if (singleSection) singleSection.style.display = 'none';
        if (batchSection) batchSection.style.display = 'none';
        if (sectionDivider) sectionDivider.style.display = 'none';
        if (mosaicSection) mosaicSection.style.display = 'none';
        if (assetSection) assetSection.style.display = 'block';
        if (globalEmpty) globalEmpty.style.display = 'none';
        if (panelHeader) panelHeader.style.display = 'none';
        if (tplShortcuts) tplShortcuts.style.display = 'none';
        if (paginationContainer) paginationContainer.style.display = 'none';
        if (assetCache.length === 0) loadAssets();
      }

      // TTS page: hide left/right panels, show full-width iframe
      const panelLeft = document.querySelector('.panel-left');
      const panelRight = document.querySelector('.panel-right');
      const ttsContainer = document.getElementById('page-tts-container');
      if (page === 'tts') {
        if (panelLeft) panelLeft.style.display = 'none';
        if (panelRight) panelRight.style.display = 'none';
        if (ttsContainer) {
          ttsContainer.style.display = 'block';
          const iframe = document.getElementById('tts-iframe');
          if (iframe && !iframe.src.includes('/tts/')) {
            iframe.src = '/tts/';
          }
        }
      } else {
        if (panelLeft) panelLeft.style.display = '';
        if (panelRight) panelRight.style.display = '';
        if (ttsContainer) ttsContainer.style.display = 'none';
      }
    });
  });
}

// ========== Admin Filter ==========
function setupToggleAllTasks() {
  const btn = document.getElementById("btn-toggle-all-tasks");
  const filterSelect = document.getElementById("admin-user-filter");
  if (!btn) return;
  btn.addEventListener("click", () => {
    adminShowAll = !adminShowAll;
    btn.textContent = adminShowAll ? "查看全部" : "仅看自己";
    btn.classList.toggle("mine-only", !adminShowAll);
    if (filterSelect) filterSelect.style.display = adminShowAll ? "" : "none";
    resetPagination();
    loadTasks();
  });
  if (filterSelect) {
    filterSelect.addEventListener("change", () => {
      adminFilterUser = filterSelect.value;
      renderCurrentTasks();
    });
    filterSelect.style.display = "";
  }
}

function updateAdminUserFilter() {
  const filterSelect = document.getElementById("admin-user-filter");
  if (!filterSelect || !adminShowAll) return;

  const counts = {};
  for (const [name, count] of Object.entries(userCounts)) {
    counts[name] = count;
  }
  const totalCounts = {};
  for (const [name, count] of Object.entries(counts)) {
    totalCounts[name] = count + (deletedSuccessByUser[name] || 0);
  }
  for (const [name, dc] of Object.entries(deletedSuccessByUser)) {
    if (!totalCounts[name]) totalCounts[name] = dc;
  }

  const sorted = Object.entries(totalCounts).sort((a, b) => b[1] - a[1]);
  const prev = filterSelect.value;
  filterSelect.innerHTML = `<option value="">全部账号</option>` +
    sorted.map(([name, count]) =>
      `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`
    ).join('');
  if (prev && Array.from(filterSelect.options).some(o => o.value === prev)) {
    filterSelect.value = prev;
  }
}

// ========== Batch Uploads ==========
function setupBatchUploads() {
  const folderInput = document.getElementById("batch-images-input");
  const filesInput = document.getElementById("batch-images-input-files");
  const videoInput = document.getElementById("batch-video-input");
  const pickFilesBtn = document.getElementById("batch-pick-files-btn");

  if (folderInput) {
    folderInput.addEventListener("change", () => {
      const files = Array.from(folderInput.files).filter(f => f.type.startsWith("image/"));
      if (files.length === 0) return;
      batchFiles.images = files.map(f => ({ file: f, url: null, name: f.name }));
      renderBatchImagePreviews();
    });
  }

  if (filesInput) {
    filesInput.addEventListener("change", () => {
      const files = Array.from(filesInput.files).filter(f => f.type.startsWith("image/"));
      if (files.length === 0) return;
      for (const f of files) {
        batchFiles.images.push({ file: f, url: null, name: f.name });
      }
      renderBatchImagePreviews();
    });
  }

  if (pickFilesBtn) {
    pickFilesBtn.addEventListener("click", () => {
      if (filesInput) filesInput.click();
    });
  }

  if (videoInput) {
    videoInput.addEventListener("change", () => {
      const file = videoInput.files[0];
      if (!file) return;
      batchFiles.video = { file, url: null, name: file.name };
      batchTemplateVideoUrl = "";
      const preview = document.getElementById("batch-video-preview");
      const dropText = videoInput.closest(".file-drop").querySelector(".drop-text");
      preview.innerHTML = `<span class="file-tag video-preview-tag">${escapeHtml(file.name)}</span>`;
      dropText.style.display = "none";
    });
  }

  // Drag and drop for batch images
  const batchDrop = document.getElementById("batch-images-drop");
  if (batchDrop) {
    batchDrop.addEventListener("dragover", (e) => { e.preventDefault(); batchDrop.classList.add("drag-over"); });
    batchDrop.addEventListener("dragleave", () => batchDrop.classList.remove("drag-over"));
    batchDrop.addEventListener("drop", (e) => {
      e.preventDefault();
      batchDrop.classList.remove("drag-over");
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
      for (const f of files) {
        batchFiles.images.push({ file: f, url: null, name: f.name });
      }
      renderBatchImagePreviews();
    });
  }
}

function renderBatchImagePreviews() {
  const countEl = document.getElementById("batch-image-count");
  const gridEl = document.getElementById("batch-images-preview");
  if (countEl) countEl.textContent = batchFiles.images.length > 0 ? `已选择 ${batchFiles.images.length} 张图片` : "";
  if (!gridEl) return;
  gridEl.innerHTML = "";
  batchFiles.images.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "batch-image-thumb";
    if (item.file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        div.innerHTML = `<img src="${e.target.result}"><button class="preview-remove" onclick="removeBatchImage(${idx})">&times;</button>`;
      };
      reader.readAsDataURL(item.file);
    } else if (item.previewUrl) {
      div.innerHTML = `<img src="${escapeHtml(item.previewUrl)}"><button class="preview-remove" onclick="removeBatchImage(${idx})">&times;</button>`;
    } else {
      div.innerHTML = `<span class="file-tag">${escapeHtml(item.name)}</span><button class="preview-remove" onclick="removeBatchImage(${idx})">&times;</button>`;
    }
    gridEl.appendChild(div);
  });
}

function removeBatchImage(index) {
  batchFiles.images.splice(index, 1);
  renderBatchImagePreviews();
}

// ========== Batch Generate ==========
function setupBatchGenerateButton() {
  const btn = document.getElementById("batch-generate-btn");
  if (!btn) return;
  btn.addEventListener("click", batchGenerate);
}

async function batchGenerate() {
  const btn = document.getElementById("batch-generate-btn");
  const prompt = (document.getElementById("batch-prompt-input").value || "").trim();
  const model = document.getElementById("batch-model-select").value;
  const resolution = document.getElementById("batch-resolution-select").value;
  const ratio = document.getElementById("batch-ratio-select").value;
  const duration = parseInt(document.getElementById("batch-duration-select").value);
  const generateAudio = document.getElementById("batch-audio-select").value === "true";
  const folderName = (document.getElementById("batch-folder-name").value || "").trim() || `批量 ${new Date().toLocaleString("zh-CN")}`;

  if (batchPresetCollection) {
    await batchGeneratePreset(folderName, model);
    return;
  }

  if (batchFiles.images.length === 0) {
    showBatchStatus("error", "请先选择批量图片");
    return;
  }

  btn.disabled = true;
  const batchId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const batchCreatedAt = new Date().toISOString();
  const total = batchFiles.images.length;
  let completed = 0;

  showBatchStatus("info", `正在上传并提交 ${total} 个任务...`);
  updateBatchProgress(0, `0/${total}`);

  // Upload batch video if needed
  let videoUrl = batchTemplateVideoUrl || "";
  if (!videoUrl && batchFiles.video && batchFiles.video.file) {
    try {
      showBatchStatus("info", "正在上传参考视频...");
      videoUrl = await uploadToOSS(batchFiles.video.file);
    } catch (err) {
      showBatchStatus("error", "参考视频上传失败: " + err.message);
      btn.disabled = false;
      hideBatchProgress();
      return;
    }
  }

  let successCount = 0, failCount = 0;
  for (let i = 0; i < total; i++) {
    const imgItem = batchFiles.images[i];
    try {
      let imgUrl = imgItem.url;
      if (!imgUrl && imgItem.file) {
        updateBatchProgress(Math.round(i / total * 100), `上传图片 ${i + 1}/${total}...`);
        imgUrl = await uploadToOSS(imgItem.file);
      }
      if (!imgUrl) { failCount++; continue; }

      const images = [{ url: imgUrl, role: "first_frame" }];
      const videos = videoUrl ? [{ url: videoUrl, role: "reference_video" }] : [];
      const mode = videoUrl ? "multimodal" : "img2video-first";

      const body = {
        model, mode, prompt, images, videos, audios: [],
        resolution, ratio, duration, generate_audio: generateAudio,
        batch_id: batchId, batch_index: i, batch_total: total,
        batch_folder_name: folderName, batch_created_at: batchCreatedAt,
      };

      const resp = await fetch("/api/create-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (resp.ok) successCount++;
      else failCount++;
    } catch (err) {
      console.error(`Batch task ${i} failed:`, err);
      failCount++;
    }
    completed++;
    updateBatchProgress(Math.round(completed / total * 100), `${completed}/${total}`);
    if (i < total - 1) await new Promise(r => setTimeout(r, 200));
  }

  btn.disabled = false;
  hideBatchProgress();
  if (failCount === 0) {
    showBatchStatus("success", `已成功提交 ${successCount} 个批量任务!`);
  } else {
    showBatchStatus("error", `提交完成: ${successCount} 成功, ${failCount} 失败`);
  }
  batchFiles.images = [];
  batchFiles.video = null;
  batchTemplateVideoUrl = "";
  batchPresetCollection = null;
  renderBatchImagePreviews();
  const vp = document.getElementById("batch-video-preview");
  if (vp) vp.innerHTML = "";
  const dt = document.querySelector('#batch-video-input')?.closest('.file-drop')?.querySelector('.drop-text');
  if (dt) dt.style.display = "";
  loadTasks();
}

async function batchGeneratePreset(folderName, modelOverride) {
  const btn = document.getElementById("batch-generate-btn");
  const preset = PRESET_COLLECTIONS[batchPresetCollection];
  if (!preset) { showBatchStatus("error", "未知合集"); btn.disabled = false; return; }

  const templateKeys = preset.templates;
  const total = templateKeys.length;
  if (batchFiles.images.length === 0) {
    showBatchStatus("error", "请先上传首帧图片");
    btn.disabled = false;
    return;
  }

  btn.disabled = true;
  const batchId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const batchCreatedAt = new Date().toISOString();
  const actualFolderName = folderName || preset.name;

  // Upload first image
  let imgUrl = batchFiles.images[0].url;
  if (!imgUrl && batchFiles.images[0].file) {
    try {
      showBatchStatus("info", "正在上传首帧图片...");
      imgUrl = await uploadToOSS(batchFiles.images[0].file);
    } catch (err) {
      showBatchStatus("error", "图片上传失败: " + err.message);
      btn.disabled = false;
      return;
    }
  }

  updateBatchProgress(0, `0/${total}`);
  let successCount = 0, failCount = 0;

  for (let i = 0; i < total; i++) {
    const tplKey = templateKeys[i];
    const tpl = BATCH_TEMPLATES[tplKey];
    if (!tpl) { failCount++; continue; }

    const model = modelOverride || tpl.model || "seedance-2.0-fast";
    const images = [{ url: imgUrl, role: "first_frame" }];
    const videos = tpl.videoUrl ? [{ url: tpl.videoUrl, role: "reference_video" }] : [];
    const mode = videos.length > 0 ? "multimodal" : "img2video-first";

    const body = {
      model, mode, prompt: tpl.prompt, images, videos, audios: [],
      resolution: "720p", ratio: tpl.ratio || "9:16",
      duration: tpl.duration || 5, generate_audio: true,
      batch_id: batchId, batch_index: i, batch_total: total,
      batch_folder_name: actualFolderName, batch_created_at: batchCreatedAt,
    };

    try {
      updateBatchProgress(Math.round(i / total * 100), `提交 ${i + 1}/${total}: ${tpl.name}`);
      const resp = await fetch("/api/create-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (resp.ok) successCount++;
      else { const err = await resp.json(); console.error(`Preset task ${tplKey} failed:`, err); failCount++; }
    } catch (err) {
      console.error(`Preset task ${tplKey} error:`, err);
      failCount++;
    }
    if (i < total - 1) await new Promise(r => setTimeout(r, 200));
  }

  btn.disabled = false;
  hideBatchProgress();
  batchPresetCollection = null;
  if (failCount === 0) showBatchStatus("success", `已提交 ${successCount} 个模版任务!`);
  else showBatchStatus("error", `提交完成: ${successCount} 成功, ${failCount} 失败`);
  loadTasks();
}

// ========== Template Shortcuts ==========
function setupTemplateShortcuts() {
  // Preset collection cards
  document.querySelectorAll('.tpl-card[data-tpl]').forEach(card => {
    card.addEventListener('click', () => {
      const tplKey = card.dataset.tpl;
      if (!tplKey) return; // disabled card
      if (tplKey.startsWith('preset_')) {
        batchPresetCollection = tplKey;
        batchTemplateVideoUrl = "";
        batchFiles.video = null;
        const preset = PRESET_COLLECTIONS[tplKey];
        if (!preset) return;
        document.getElementById("batch-folder-name").value = preset.name;
        document.getElementById("batch-prompt-input").value = "";
        const vp = document.getElementById("batch-video-preview");
        if (vp) vp.innerHTML = "";
        showBatchStatus("info", `已选择合集「${preset.name}」(${preset.templates.length} 个模版)，上传首帧图片后点击生成`);
      }
    });
  });

  // Single template buttons
  document.querySelectorAll('.tpl-shortcut-btn.single[data-tpl]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tplKey = btn.dataset.tpl;
      const tpl = BATCH_TEMPLATES[tplKey];
      if (!tpl) return;
      batchPresetCollection = null;
      document.getElementById("batch-prompt-input").value = tpl.prompt;
      document.getElementById("batch-folder-name").value = tpl.name;
      if (tpl.videoUrl) {
        batchTemplateVideoUrl = tpl.videoUrl;
        batchFiles.video = null;
        const preview = document.getElementById("batch-video-preview");
        const dropText = document.querySelector('#batch-video-input')?.closest('.file-drop')?.querySelector('.drop-text');
        if (preview) preview.innerHTML = `<span class="file-tag video-preview-tag">模版视频: ${escapeHtml(tpl.name)}</span>`;
        if (dropText) dropText.style.display = "none";
      }
      if (tpl.duration) document.getElementById("batch-duration-select").value = String(tpl.duration);
      if (tpl.ratio) document.getElementById("batch-ratio-select").value = tpl.ratio;
      if (tpl.model) document.getElementById("batch-model-select").value = tpl.model;
      showBatchStatus("info", `已加载模版「${tpl.name}」，上传图片后点击生成`);
    });
  });
}

// ========== Admin Panel ==========
function setupAdminPanel() {
  const btn = document.getElementById("btn-admin-panel");
  if (!btn) return;
  btn.addEventListener("click", showAdminPanel);
}

function showAdminPanel() {
  const existing = document.querySelector('.admin-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.className = "admin-overlay";
  overlay.innerHTML = `
    <div class="admin-panel">
      <div class="admin-panel-header">
        <h2>设置管理</h2>
        <button class="close-btn">&times;</button>
      </div>
      <div class="admin-tabs">
        <button class="admin-tab active" data-tab="users">账号管理</button>
        <button class="admin-tab" data-tab="stats">费用统计</button>
      </div>
      <div id="admin-tab-users" class="admin-tab-content">
        <div class="admin-create-form">
          <input type="text" id="admin-new-username" placeholder="用户名 (至少2字符)">
          <input type="password" id="admin-new-password" placeholder="密码 (至少6字符)">
          <button id="admin-create-btn">创建子账号</button>
        </div>
        <div id="admin-msg" style="font-size:13px;margin-bottom:12px;display:none;"></div>
        <table class="admin-user-table">
          <thead><tr><th>用户名</th><th>角色</th><th>状态</th><th>成功数</th><th>创建时间</th><th>操作</th></tr></thead>
          <tbody id="admin-user-list"></tbody>
        </table>
      </div>
      <div id="admin-tab-stats" class="admin-tab-content" style="display:none;">
        <div id="admin-stats-content"><div class="stats-loading">加载中...</div></div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector(".close-btn").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

  // Tab switching
  overlay.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      overlay.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      overlay.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');
      const target = document.getElementById('admin-tab-' + tab.dataset.tab);
      if (target) target.style.display = 'block';
      if (tab.dataset.tab === 'stats') loadAdminStats();
    });
  });

  // Create user
  overlay.querySelector("#admin-create-btn").addEventListener("click", async () => {
    const u = overlay.querySelector("#admin-new-username").value.trim();
    const p = overlay.querySelector("#admin-new-password").value;
    const msg = overlay.querySelector("#admin-msg");
    if (!u || u.length < 2) { showAdminMsg(msg, "用户名至少2个字符", true); return; }
    if (!p || p.length < 6) { showAdminMsg(msg, "密码至少6个字符", true); return; }
    try {
      const resp = await fetch("/api/admin/users", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username: u, password: p})
      });
      const data = await resp.json();
      if (!resp.ok) { showAdminMsg(msg, data.error || "创建失败", true); return; }
      showAdminMsg(msg, `账号 "${data.username}" 创建成功`, false);
      overlay.querySelector("#admin-new-username").value = "";
      overlay.querySelector("#admin-new-password").value = "";
      refreshAdminUserList(overlay);
    } catch(e) { showAdminMsg(msg, "网络错误", true); }
  });

  refreshAdminUserList(overlay);
}

function showAdminMsg(el, text, isError) {
  el.style.display = "block";
  el.style.color = isError ? "var(--danger)" : "var(--success)";
  el.textContent = text;
  setTimeout(() => { el.style.display = "none"; }, 3000);
}

async function refreshAdminUserList(overlay) {
  try {
    const resp = await fetch("/api/admin/users");
    const users = await resp.json();
    const tbody = overlay.querySelector("#admin-user-list");
    const myRole = typeof CURRENT_ROLE !== "undefined" ? CURRENT_ROLE : "user";
    tbody.innerHTML = users.map(u => {
      const disabled = u.disabled;
      const date = new Date(u.created_at * 1000).toLocaleDateString("zh-CN");
      const roleLabelMap = { superadmin: "超级管理员", admin: "管理员", user: "子账号" };
      const roleLabel = roleLabelMap[u.role] || u.role;
      const roleClass = u.role === "superadmin" ? "role-superadmin" : u.role === "admin" ? "role-admin" : "role-user";

      let ops = "";
      if (u.role === "superadmin") {
        ops = "-";
      } else if (u.role === "admin") {
        if (myRole === "superadmin") {
          ops = `
            <button class="admin-btn" onclick="adminToggleUser('${u.id}')">${disabled ? '启用' : '禁用'}</button>
            <button class="admin-btn" onclick="adminResetPwd('${u.id}','${escapeHtml(u.username)}')">重置密码</button>
            <button class="admin-btn demote" onclick="adminSetRole('${u.id}','user','${escapeHtml(u.username)}')">降为子账号</button>
            <button class="admin-btn danger" onclick="adminDeleteUser('${u.id}','${escapeHtml(u.username)}')">删除</button>
          `;
        } else {
          ops = "-";
        }
      } else {
        ops = `
          <button class="admin-btn" onclick="adminToggleUser('${u.id}')">${disabled ? '启用' : '禁用'}</button>
          <button class="admin-btn" onclick="adminResetPwd('${u.id}','${escapeHtml(u.username)}')">重置密码</button>
          ${myRole === "superadmin" ? `<button class="admin-btn promote" onclick="adminSetRole('${u.id}','admin','${escapeHtml(u.username)}')">提升为管理员</button>` : ""}
          <button class="admin-btn danger" onclick="adminDeleteUser('${u.id}','${escapeHtml(u.username)}')">删除</button>
        `;
      }

      return `<tr class="${disabled ? 'disabled-row' : ''}">
        <td>${escapeHtml(u.username)}</td>
        <td><span class="role-badge ${roleClass}">${roleLabel}</span></td>
        <td>${disabled ? '<span style="color:var(--danger)">已禁用</span>' : '<span style="color:var(--success)">正常</span>'}</td>
        <td>${u.success_count || 0}</td>
        <td>${date}</td>
        <td>${ops}</td>
      </tr>`;
    }).join("");
  } catch(e) { console.error("Failed to load users", e); }
}

async function adminToggleUser(userId) {
  try {
    await fetch(`/api/admin/users/${userId}/toggle`, {method: "PUT"});
    const overlay = document.querySelector(".admin-overlay");
    if (overlay) await refreshAdminUserList(overlay);
  } catch(e) { alert("操作失败"); }
}

async function adminResetPwd(userId, username) {
  const pwd = prompt(`为 "${username}" 设置新密码（至少6位）：`);
  if (!pwd) return;
  if (pwd.length < 6) { alert("密码至少6个字符"); return; }
  try {
    const resp = await fetch(`/api/admin/users/${userId}/reset-password`, {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({password: pwd})
    });
    const data = await resp.json();
    if (resp.ok) { alert("密码已重置"); } else { alert(data.error || "操作失败"); }
  } catch(e) { alert("网络错误"); }
}

async function adminSetRole(userId, newRole, username) {
  const roleLabel = newRole === "admin" ? "管理员" : "子账号";
  if (!confirm(`确定要将 "${username}" 设为${roleLabel}吗？`)) return;
  try {
    const resp = await fetch(`/api/admin/users/${userId}/set-role`, {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({role: newRole})
    });
    const data = await resp.json();
    if (resp.ok) {
      const overlay = document.querySelector(".admin-overlay");
      if (overlay) await refreshAdminUserList(overlay);
    } else { alert(data.error || "操作失败"); }
  } catch(e) { alert("网络错误"); }
}

async function adminDeleteUser(userId, username) {
  if (!confirm(`确定要删除账号 "${username}" 吗？该用户的任务将保留。`)) return;
  try {
    const resp = await fetch(`/api/admin/users/${userId}`, {method: "DELETE"});
    const data = await resp.json();
    if (resp.ok) {
      const overlay = document.querySelector(".admin-overlay");
      if (overlay) await refreshAdminUserList(overlay);
    } else { alert(data.error || "删除失败"); }
  } catch(e) { alert("网络错误"); }
}

async function loadAdminStats() {
  const container = document.getElementById('admin-stats-content');
  if (!container) return;
  container.innerHTML = '<div class="stats-loading">加载中...</div>';
  try {
    const resp = await fetch('/api/stats/overview');
    if (!resp.ok) {
      container.innerHTML = '<div class="stats-loading">加载失败: ' + resp.status + '</div>';
      return;
    }
    const data = await resp.json();
    renderAdminStats(data, container);
  } catch (err) {
    container.innerHTML = '<div class="stats-loading">网络错误</div>';
  }
}

function statsCard(label, value, colorClass) {
  const cls = colorClass ? ' stats-card-' + colorClass : '';
  return '<div class="stats-card' + cls + '">'
    + '<div class="stats-value">' + value + '</div>'
    + '<div class="stats-label">' + label + '</div>'
    + '</div>';
}

function renderAdminStats(data, container) {
  // Summary cards
  let html = '<div class="stats-cards">';
  html += statsCard("统计视频数", data.total_count, "");
  html += statsCard("总 Tokens", formatTokens(data.total_tokens), "accent");
  html += statsCard("总费用", "\u00A5" + formatCost(data.total_cost_yuan), "warning");
  html += '</div>';

  // By model table
  html += '<h4 class="stats-section-title">按模型统计</h4>';
  html += '<table class="stats-table"><thead><tr>';
  html += '<th>模型</th><th>视频数</th><th>Tokens</th><th>费用</th>';
  html += '</tr></thead><tbody>';
  for (const [model, info] of Object.entries(data.by_model || {})) {
    const label = model === "seedance-2.0" ? "Seedance 2.0 (\u6807\u51C6)" : model === "seedance-2.0-fast" ? "Seedance 2.0 Fast (\u5FEB\u901F)" : model;
    html += '<tr>';
    html += '<td>' + label + '</td>';
    html += '<td>' + info.count + '</td>';
    html += '<td>' + formatTokens(info.tokens) + '</td>';
    html += '<td>\u00A5' + formatCost(info.cost) + '</td>';
    html += '</tr>';
  }
  html += '</tbody></table>';

  // By duration table (per model)
  html += '<h4 class="stats-section-title">按生成秒数统计</h4>';
  html += '<table class="stats-table"><thead><tr>';
  html += '<th>模型</th><th>秒数</th><th>视频数</th><th>Tokens</th><th>费用</th>';
  html += '</tr></thead><tbody>';
  let lastModel = "";
  for (const d of (data.by_duration || [])) {
    const modelLabel = d.model === "seedance-2.0" ? "Seedance 2.0 (\u6807\u51C6)" : d.model === "seedance-2.0-fast" ? "Seedance 2.0 Fast (\u5FEB\u901F)" : d.model;
    const showModel = (d.model !== lastModel) ? modelLabel : "";
    html += '<tr>';
    html += '<td style="color:var(--text-secondary)">' + showModel + '</td>';
    html += '<td>' + d.duration + 's</td>';
    html += '<td>' + d.count + '</td>';
    html += '<td>' + formatTokens(d.tokens) + '</td>';
    html += '<td>\u00A5' + formatCost(d.cost) + '</td>';
    html += '</tr>';
    lastModel = d.model;
  }
  if (!data.by_duration || data.by_duration.length === 0) {
    html += '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary)">暂无数据</td></tr>';
  }
  html += '</tbody></table>';

  // By month table
  html += '<h4 class="stats-section-title">按月汇总</h4>';
  html += '<table class="stats-table"><thead><tr>';
  html += '<th>月份</th><th>视频数</th><th>Tokens</th><th>费用</th>';
  html += '</tr></thead><tbody>';
  for (const m of (data.by_month || [])) {
    html += '<tr>';
    html += '<td>' + m.month + '</td>';
    html += '<td>' + m.count + '</td>';
    html += '<td>' + formatTokens(m.tokens) + '</td>';
    html += '<td>\u00A5' + formatCost(m.cost) + '</td>';
    html += '</tr>';
  }
  if (!data.by_month || data.by_month.length === 0) {
    html += '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary)">暂无数据</td></tr>';
  }
  html += '</tbody></table>';

  // By day table
  html += '<h4 class="stats-section-title">按天明细</h4>';
  html += '<table class="stats-table"><thead><tr>';
  html += '<th>日期</th><th>视频数</th><th>Tokens</th><th>费用</th>';
  html += '</tr></thead><tbody>';
  for (const d of (data.by_day || [])) {
    html += '<tr>';
    html += '<td>' + d.date + '</td>';
    html += '<td>' + d.count + '</td>';
    html += '<td>' + formatTokens(d.tokens) + '</td>';
    html += '<td>\u00A5' + formatCost(d.cost) + '</td>';
    html += '</tr>';
  }
  if (!data.by_day || data.by_day.length === 0) {
    html += '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary)">暂无数据</td></tr>';
  }
  html += '</tbody></table>';

  // By user
  if (data.by_user && data.by_user.length > 0) {
    html += '<h4 class="stats-section-title">按账号 (计费)</h4>';
    html += '<table class="stats-table"><thead><tr>';
    html += '<th>账号</th><th>视频数</th><th>Tokens</th><th>费用</th>';
    html += '</tr></thead><tbody>';
    for (const u of data.by_user) {
      html += '<tr>';
      html += '<td>' + escapeHtml(u.username) + '</td>';
      html += '<td>' + u.count + '</td>';
      html += '<td>' + formatTokens(u.tokens) + '</td>';
      html += '<td>\u00A5' + formatCost(u.cost) + '</td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
  }

  // By user success
  if (data.by_user_success && data.by_user_success.length > 0) {
    html += '<h4 class="stats-section-title">按账号 (成功视频数)</h4>';
    html += '<table class="stats-table"><thead><tr>';
    html += '<th>账号</th><th>成功视频数</th>';
    html += '</tr></thead><tbody>';
    for (const u of data.by_user_success) {
      html += '<tr>';
      html += '<td>' + escapeHtml(u.username) + '</td>';
      html += '<td>' + u.count + '</td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
  }

  html += '<p class="stats-note">* 仅统计有 token 记录的任务（从 2026-04-28 起开始记录）</p>';

  container.innerHTML = html;
}

// ========== Asset Management ==========
function setupAssetPage() {
  const fileInput = document.getElementById("asset-file-input");
  const fileDrop = document.getElementById("asset-file-drop");
  const submitBtn = document.getElementById("asset-submit-btn");

  if (fileInput) {
    fileInput.addEventListener("change", () => {
      const file = fileInput.files[0];
      if (!file) return;
      assetUploadFile = file;
      const preview = document.getElementById("asset-file-preview");
      const dropText = document.getElementById("asset-drop-text");
      if (dropText) dropText.style.display = "none";

      // Auto-detect type
      const typeSelect = document.getElementById("asset-type-select");
      if (file.type.startsWith("image/")) typeSelect.value = "Image";
      else if (file.type.startsWith("video/")) typeSelect.value = "Video";
      else if (file.type.startsWith("audio/")) typeSelect.value = "Audio";

      if (file.type.startsWith("image/") && preview) {
        const reader = new FileReader();
        reader.onload = (e) => { preview.innerHTML = `<img src="${e.target.result}">`; };
        reader.readAsDataURL(file);
      } else if (preview) {
        preview.innerHTML = `<span class="file-tag">${escapeHtml(file.name)}</span>`;
      }
    });
  }

  if (fileDrop) {
    fileDrop.addEventListener("click", (e) => {
      if (e.target.closest(".preview-remove")) return;
      if (fileInput) fileInput.click();
    });
    fileDrop.addEventListener("dragover", (e) => { e.preventDefault(); fileDrop.classList.add("drag-over"); });
    fileDrop.addEventListener("dragleave", () => fileDrop.classList.remove("drag-over"));
    fileDrop.addEventListener("drop", (e) => {
      e.preventDefault();
      fileDrop.classList.remove("drag-over");
      if (e.dataTransfer.files.length > 0 && fileInput) {
        fileInput.files = e.dataTransfer.files;
        fileInput.dispatchEvent(new Event("change"));
      }
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", submitAsset);
  }

  // Filter buttons
  document.querySelectorAll(".asset-filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".asset-filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      assetFilterStatus = btn.dataset.status || "";
      assetCurrentPage = 1;
      assetCache = [];
      loadAssets();
    });
  });

  // Sub-tab switching
  document.querySelectorAll(".asset-sub-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".asset-sub-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      assetSubTab = tab.dataset.assetTab;
      document.getElementById("asset-tab-mine").style.display = assetSubTab === "mine" ? "" : "none";
      document.getElementById("asset-tab-public").style.display = assetSubTab === "public" ? "" : "none";
      if (assetSubTab === "public" && publicAssetCache.length === 0) loadPublicAssets();
    });
  });

  // Load more buttons
  const publicLoadMore = document.getElementById("asset-public-load-more");
  if (publicLoadMore) {
    publicLoadMore.addEventListener("click", () => {
      publicAssetCurrentPage++;
      loadPublicAssets(true);
    });
  }
}

async function submitAsset() {
  const statusEl = document.getElementById("asset-upload-status");
  if (!assetUploadFile) {
    statusEl.style.display = "block";
    statusEl.className = "status-message error";
    statusEl.textContent = "请先选择文件";
    return;
  }
  const typeSelect = document.getElementById("asset-type-select");
  const resourceType = typeSelect.value;
  const submitBtn = document.getElementById("asset-submit-btn");
  submitBtn.disabled = true;

  statusEl.style.display = "block";
  statusEl.className = "status-message info";
  statusEl.textContent = "正在上传文件...";

  try {
    const url = await uploadToOSS(assetUploadFile);
    statusEl.textContent = "正在提交审核...";
    const resp = await fetch("/api/asset/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource_url: url, resource_type: resourceType }),
    });
    const result = await resp.json();
    if (resp.ok && result.data) {
      statusEl.className = "status-message success";
      statusEl.textContent = "素材已提交审核!";
      assetUploadFile = null;
      const preview = document.getElementById("asset-file-preview");
      const dropText = document.getElementById("asset-drop-text");
      if (preview) preview.innerHTML = "";
      if (dropText) dropText.style.display = "";
      assetCache = [];
      assetCurrentPage = 1;
      setTimeout(() => { statusEl.style.display = "none"; }, 5000);
      loadAssets();
    } else {
      statusEl.className = "status-message error";
      statusEl.textContent = result.error || "提交失败";
    }
  } catch (err) {
    statusEl.className = "status-message error";
    statusEl.textContent = "提交失败: " + err.message;
  }
  submitBtn.disabled = false;
}

async function loadAssets(append) {
  try {
    const body = { page: assetCurrentPage, page_size: 10 };
    if (assetFilterStatus) body.status = assetFilterStatus;
    if (assetFilterOwner) body.owner = assetFilterOwner;
    const resp = await fetch("/api/asset/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await resp.json();
    if (result.data) {
      const items = result.data.Items || [];
      assetTotalPages = result.data.TotalPages || 1;
      assetCurrentPage = result.data.Page || 1;
      assetCache = items;
      renderAssetList();
      renderAssetPagination();

      // Start polling for processing assets
      for (const item of items) {
        if (item.status === "Processing" && !assetPollTimers[item.id]) {
          pollAssetStatus(item.id);
        }
      }
    }
  } catch (err) { console.error("Failed to load assets:", err); }
}

function renderAssetList() {
  const listEl = document.getElementById("asset-list-mine");
  const emptyEl = document.getElementById("asset-list-empty");
  if (!listEl) return;

  if (assetCache.length === 0) {
    listEl.innerHTML = "";
    if (emptyEl) emptyEl.style.display = "block";
    renderAssetPagination();
    return;
  }
  if (emptyEl) emptyEl.style.display = "none";

  listEl.innerHTML = assetCache.map(item => {
    const st = item.status || "";
    const statusClass = st === "Active" ? "active" : st === "Processing" ? "processing" : "failed";
    const statusLabel = { Processing: "审核中", Active: "已通过", Failed: "失败" }[st] || st;
    const isSelected = selectedAssetId === item.id;
    const thumbHtml = getAssetThumb(item);
    const created = item.created_at ? `<div style="font-size:10px;color:var(--text-secondary);margin-top:2px;">${escapeHtml(item.created_at)}</div>` : '';

    return `<div class="asset-card${isSelected ? ' selected' : ''}" data-asset-id="${escapeHtml(item.id)}" onclick="showAssetDetail('${escapeHtml(item.id)}')">
      <div class="asset-card-thumb">${thumbHtml}</div>
      <div class="asset-card-info">
        <div class="asset-card-name" title="${escapeHtml(item.id)}">${escapeHtml(item.id.length > 20 ? item.id.slice(0, 20) + '...' : item.id)}</div>
        <span class="asset-card-status status-${statusClass}">${statusLabel}</span>
        ${created}
      </div>
      <div class="asset-card-actions">
        ${st === 'Active' ? `<button onclick="event.stopPropagation(); copyAssetId('${escapeHtml(item.id)}')">复制ID</button>` : ''}
        ${st === 'Processing' ? `<button onclick="event.stopPropagation(); pollAssetStatus('${escapeHtml(item.id)}')">刷新状态</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

function renderAssetPagination() {
  let container = document.getElementById("asset-pagination");
  if (!container) {
    const listEl = document.getElementById("asset-list-mine");
    if (!listEl) return;
    container = document.createElement("div");
    container.id = "asset-pagination";
    container.className = "asset-pagination";
    listEl.parentNode.insertBefore(container, listEl.nextSibling);
  }
  if (assetTotalPages <= 1) { container.innerHTML = ''; return; }

  let html = '<div class="pagination">';
  html += `<button class="page-btn" ${assetCurrentPage <= 1 ? 'disabled' : ''} onclick="goToAssetPage(${assetCurrentPage - 1})">上一页</button>`;
  const maxButtons = 5;
  let startPage = Math.max(1, assetCurrentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(assetTotalPages, startPage + maxButtons - 1);
  if (endPage - startPage < maxButtons - 1) startPage = Math.max(1, endPage - maxButtons + 1);
  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-btn${i === assetCurrentPage ? ' active' : ''}" onclick="goToAssetPage(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" ${assetCurrentPage >= assetTotalPages ? 'disabled' : ''} onclick="goToAssetPage(${assetCurrentPage + 1})">下一页</button>`;
  html += '</div>';
  container.innerHTML = html;
}

function goToAssetPage(page) {
  if (page < 1 || page > assetTotalPages || page === assetCurrentPage) return;
  assetCurrentPage = page;
  loadAssets();
}

function getAssetThumb(item) {
  const preview = item.url || item.PreviewUrl || item.URL || '';
  const assetType = (item.type || item.AssetType || '').toLowerCase();
  if (preview && assetType === 'image') {
    return `<img src="${escapeHtml(preview)}" alt="" onerror="this.outerHTML='<span class=\\'asset-type-icon\\'>&#x1F5BC;</span>'" loading="lazy">`;
  }
  if (preview && assetType === 'video') {
    return `<video src="${escapeHtml(preview)}" muted playsinline preload="auto" onerror="this.outerHTML='<span class=\\'asset-type-icon\\'>&#x1F3AC;</span>'"></video>`;
  }
  const iconMap = { image: '&#x1F5BC;', video: '&#x1F3AC;', audio: '&#x1F3B5;' };
  return `<span class="asset-type-icon">${iconMap[assetType] || '&#x1F4C1;'}</span>`;
}

function copyAssetId(assetId) {
  navigator.clipboard.writeText(assetId).then(() => {
    alert("资产ID已复制");
  }).catch(() => {
    alert("复制失败");
  });
}

async function showAssetDetail(assetId) {
  selectedAssetId = assetId;
  renderAssetList();

  const detailEl = document.getElementById("asset-detail-inline");
  const emptyEl = document.getElementById("asset-detail-empty");
  if (!detailEl) return;
  if (emptyEl) emptyEl.style.display = "none";

  detailEl.innerHTML = '<div class="stats-loading">查询中...</div>';

  try {
    const resp = await fetch("/api/asset/get", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asset_id: assetId }),
    });
    const result = await resp.json();

    const item = assetCache.find(a => a.id === assetId);
    const apiData = result.data || {};
    const status = apiData.Status || (item ? item.status : "unknown");
    const statusLabel = { Processing: "审核中", Active: "已通过", Failed: "失败" }[status] || status;

    const url = item ? item.url : '';
    const assetType = (item ? item.type : '').toLowerCase();
    const created = item ? (item.created_at || '') : '';
    const assetIdDisplay = apiData.Id || assetId;

    let previewHtml = '';
    if (url && assetType === 'image') {
      previewHtml = `<div style="margin-bottom:12px;border-radius:8px;overflow:hidden;background:var(--bg-secondary);">
        <img src="${escapeHtml(url)}" style="width:100%;max-height:240px;object-fit:contain;display:block;" alt="素材预览">
      </div>`;
    } else if (url && assetType === 'video') {
      previewHtml = `<div style="margin-bottom:12px;border-radius:8px;overflow:hidden;background:#000;">
        <video src="${escapeHtml(url)}" controls playsinline preload="auto" style="width:100%;max-height:240px;display:block;"></video>
      </div>`;
    } else if (url && assetType === 'audio') {
      previewHtml = `<div style="margin-bottom:12px;">
        <audio src="${escapeHtml(url)}" controls style="width:100%;"></audio>
      </div>`;
    }

    detailEl.innerHTML = `
      ${previewHtml}
      <div class="asset-detail-item"><span class="label">资产ID</span><span class="value" style="word-break:break-all;">${escapeHtml(assetIdDisplay)}</span></div>
      <div class="asset-detail-item"><span class="label">类型</span><span class="value">${escapeHtml(item ? item.type : '-')}</span></div>
      <div class="asset-detail-item"><span class="label">状态</span><span class="value">${escapeHtml(statusLabel)}</span></div>
      ${created ? `<div class="asset-detail-item"><span class="label">创建时间</span><span class="value">${escapeHtml(created)}</span></div>` : ''}
      ${status === 'Active' ? `<div class="asset-detail-item"><span class="label">使用方式</span><span class="value" style="word-break:break-all;"><code>asset://${escapeHtml(assetIdDisplay)}</code></span></div>` : ''}
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
        ${status === 'Active' ? `<button class="btn-asset-pick" onclick="copyAssetId('${escapeHtml(assetIdDisplay)}')">复制资产ID</button>` : ''}
        <button class="btn-danger" onclick="deleteAsset('${escapeHtml(assetId)}')">删除素材</button>
      </div>
    `;

    // Update local cache status
    if (item && status !== item.status) {
      item.status = status;
      renderAssetList();
    }
  } catch (err) {
    detailEl.innerHTML = '<div class="section-empty">查询失败</div>';
  }
}

async function deleteAsset(assetId) {
  if (!confirm("确定要删除此素材吗？")) return;
  try {
    const resp = await fetch("/api/asset/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asset_id: assetId }),
    });
    if (resp.ok) {
      selectedAssetId = null;
      const detailEl = document.getElementById("asset-detail-inline");
      const emptyEl = document.getElementById("asset-detail-empty");
      if (detailEl) detailEl.innerHTML = "";
      if (emptyEl) emptyEl.style.display = "block";
      assetCache = assetCache.filter(a => a.id !== assetId);
      renderAssetList();
    } else {
      const r = await resp.json();
      alert(r.error || "删除失败");
    }
  } catch (_) { alert("网络错误"); }
}

function pollAssetStatus(assetId) {
  if (assetPollTimers[assetId]) return;
  let attempts = 0;
  const maxAttempts = 60; // ~10 minutes at 10s interval
  assetPollTimers[assetId] = setInterval(async () => {
    attempts++;
    if (attempts > maxAttempts) {
      clearInterval(assetPollTimers[assetId]);
      delete assetPollTimers[assetId];
      return;
    }
    try {
      const resp = await fetch("/api/asset/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_id: assetId }),
      });
      const result = await resp.json();
      if (result.data) {
        const newStatus = result.data.Status;
        if (newStatus && newStatus !== "Processing") {
          clearInterval(assetPollTimers[assetId]);
          delete assetPollTimers[assetId];
          const item = assetCache.find(a => a.id === assetId);
          if (item) { item.status = newStatus; renderAssetList(); }
          if (selectedAssetId === assetId) showAssetDetail(assetId);
        }
      }
    } catch (_) {}
  }, 10000);
}

// ========== Public Assets ==========
async function loadPublicAssets(append) {
  try {
    const body = { page_size: 50 };
    const resp = await fetch("/api/asset/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await resp.json();
    if (result.data) {
      const items = result.data.Items || result.data.Groups || [];
      if (append) {
        publicAssetCache = publicAssetCache.concat(items);
      } else {
        publicAssetCache = items;
      }
      renderPublicAssetList();
    }
  } catch (err) { console.error("Failed to load public assets:", err); }
}

function renderPublicAssetList() {
  const listEl = document.getElementById("asset-list-public");
  const emptyEl = document.getElementById("asset-public-empty");
  if (!listEl) return;

  if (publicAssetCache.length === 0) {
    listEl.innerHTML = "";
    if (emptyEl) emptyEl.style.display = "block";
    return;
  }
  if (emptyEl) emptyEl.style.display = "none";

  listEl.innerHTML = publicAssetCache.map(group => {
    const assets = group.Assets || [];
    const name = group.Name || group.GroupName || "虚拟人";
    const coverUrl = assets.length > 0 ? (assets[0].PreviewUrl || assets[0].URL || '') : '';
    const assetCount = assets.length;

    return `<div class="asset-card public-asset-card">
      <div class="asset-card-thumb">${coverUrl ? `<img src="${escapeHtml(coverUrl)}" loading="lazy">` : '<div class="asset-type-icon">&#x1F9D1;</div>'}</div>
      <div class="asset-card-info">
        <div class="asset-card-name">${escapeHtml(name)}</div>
        <span class="asset-card-status">${assetCount} 个素材</span>
      </div>
    </div>`;
  }).join('');
}

// ========== Asset Picker ==========
function openAssetPicker(type, target, multi) {
  assetPickerType = type || "image";
  assetPickerTarget = target;
  assetPickerMulti = !!multi;
  assetPickerSelected = [];
  pickerAssetItems = [];
  pickerCurrentPage = 1;
  pickerTotalPages = 1;

  // Always recreate overlay to ensure latest template
  let overlay = document.getElementById('asset-picker-overlay');
  if (overlay) overlay.remove();
  overlay = document.createElement('div');
  overlay.id = 'asset-picker-overlay';
  overlay.className = 'asset-picker-overlay';
  overlay.innerHTML = `
    <div class="asset-picker-modal">
      <div class="asset-picker-header">
        <h3>选择资产</h3>
        <button class="asset-picker-close" onclick="closeAssetPicker()">&times;</button>
      </div>
      <div class="asset-picker-body">
        <div class="asset-picker-grid" id="asset-picker-grid"></div>
        <div class="asset-picker-empty" id="asset-picker-empty" style="display:none">暂无可用资产</div>
        <div class="asset-picker-pagination" id="asset-picker-pagination"></div>
      </div>
      <div class="asset-picker-footer">
        <button class="btn-cancel" onclick="closeAssetPicker()">取消</button>
        <button class="btn-confirm" id="btn-picker-confirm" onclick="onAssetPickerConfirm()" disabled>确认选择</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  // Update title
  const typeLabel = { image: '图片', video: '视频', audio: '音频' }[type] || '';
  const h3 = overlay.querySelector('.asset-picker-header h3');
  if (h3) h3.textContent = '选择' + typeLabel + '资产';

  overlay.classList.add('active');
  loadAssetPickerList();
}

function closeAssetPicker() {
  const overlay = document.getElementById('asset-picker-overlay');
  if (overlay) overlay.classList.remove('active');
}

async function loadAssetPickerList() {
  const grid = document.getElementById("asset-picker-grid");
  const empty = document.getElementById("asset-picker-empty");
  const paginationEl = document.getElementById("asset-picker-pagination");
  if (grid) grid.innerHTML = '<div class="asset-picker-empty">加载中...</div>';
  if (empty) empty.style.display = 'none';
  if (paginationEl) paginationEl.innerHTML = '';

  try {
    const resp = await fetch("/api/asset/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: pickerCurrentPage, page_size: 10, status: "Active", type: assetPickerType }),
    });
    const data = await resp.json();
    const result = data.data || {};
    const items = result.Items || [];
    pickerTotalPages = result.TotalPages || 1;
    pickerCurrentPage = result.Page || 1;
    pickerAssetItems = items;

    if (!items.length) {
      if (grid) grid.innerHTML = '';
      if (empty) { empty.style.display = ''; empty.textContent = '暂无可用的' + ({image:'图片',video:'视频',audio:'音频'}[assetPickerType]||'') + '资产'; }
      renderPickerPagination();
      return;
    }
    let html = '';
    for (const item of items) {
      const id = item.id || item.Id || item.AssetId || '';
      const name = item.id || item.Name || id;
      const thumbHtml = getAssetThumb(item);
      const isSelected = assetPickerSelected.includes(id);
      html += `<div class="asset-picker-card${isSelected ? ' selected' : ''}" data-asset-id="${escapeHtml(id)}" onclick="togglePickerCard(this)">
        <div class="picker-thumb">${thumbHtml}</div>
        <div class="picker-name" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
      </div>`;
    }
    if (grid) grid.innerHTML = html;
    renderPickerPagination();
  } catch (e) {
    if (grid) grid.innerHTML = `<div class="asset-picker-empty">加载失败</div>`;
  }
}

function renderPickerPagination() {
  const container = document.getElementById("asset-picker-pagination");
  if (!container) return;
  if (pickerTotalPages <= 1) { container.innerHTML = ''; return; }

  let html = '<div class="pagination">';
  html += `<button class="page-btn" ${pickerCurrentPage <= 1 ? 'disabled' : ''} onclick="goToPickerPage(${pickerCurrentPage - 1})">上一页</button>`;
  const maxButtons = 5;
  let startPage = Math.max(1, pickerCurrentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(pickerTotalPages, startPage + maxButtons - 1);
  if (endPage - startPage < maxButtons - 1) startPage = Math.max(1, endPage - maxButtons + 1);
  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-btn${i === pickerCurrentPage ? ' active' : ''}" onclick="goToPickerPage(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" ${pickerCurrentPage >= pickerTotalPages ? 'disabled' : ''} onclick="goToPickerPage(${pickerCurrentPage + 1})">下一页</button>`;
  html += '</div>';
  container.innerHTML = html;
}

function goToPickerPage(page) {
  if (page < 1 || page > pickerTotalPages || page === pickerCurrentPage) return;
  pickerCurrentPage = page;
  loadAssetPickerList();
}

function togglePickerCard(card) {
  const assetId = card.dataset.assetId;
  if (assetPickerMulti) {
    card.classList.toggle('selected');
    if (card.classList.contains('selected')) {
      assetPickerSelected.push(assetId);
    } else {
      assetPickerSelected = assetPickerSelected.filter(id => id !== assetId);
    }
  } else {
    document.querySelectorAll('.asset-picker-card.selected').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    assetPickerSelected = [assetId];
  }
  const confirmBtn = document.getElementById('btn-picker-confirm');
  if (confirmBtn) confirmBtn.disabled = assetPickerSelected.length === 0;
}

function onAssetPickerConfirm() {
  if (assetPickerSelected.length === 0) return;

  const selectedItems = assetPickerSelected.map(id => pickerAssetItems.find(a => a.id === id)).filter(Boolean);

  if (assetPickerTarget === "firstFrame") {
    const item = selectedItems[0];
    if (!item) return;
    const assetUrl = `asset://${item.id}`;
    uploadedFiles.firstFrame = { file: null, url: assetUrl, previewUrl: item.url, name: item.id };
    const preview = document.getElementById("first-frame-preview");
    const dropText = document.querySelector('#first-frame-input')?.closest('.file-drop')?.querySelector('.drop-text');
    if (preview && item.url) preview.innerHTML = `<img src="${escapeHtml(item.url)}" style="cursor:pointer;">`;
    if (dropText) dropText.style.display = "none";
    updateCostEstimate();
  } else if (assetPickerTarget === "refImages") {
    for (const item of selectedItems) {
      uploadedFiles.refImages.push({ file: null, url: `asset://${item.id}`, previewUrl: item.url, name: item.id });
    }
    rebuildMultiPreview("refImages", "ref-images-preview");
    updateCostEstimate();
  } else if (assetPickerTarget === "refVideos") {
    for (const item of selectedItems) {
      uploadedFiles.refVideos.push({ file: null, url: `asset://${item.id}`, previewUrl: item.url, name: item.id });
    }
    rebuildMultiPreview("refVideos", "ref-videos-preview");
    updateCostEstimate();
  } else if (assetPickerTarget === "refAudios") {
    for (const item of selectedItems) {
      uploadedFiles.refAudios.push({ file: null, url: `asset://${item.id}`, name: item.id });
    }
    rebuildMultiPreview("refAudios", "ref-audios-preview");
    updateCostEstimate();
  } else if (assetPickerTarget === "batchImages") {
    for (const item of selectedItems) {
      batchFiles.images.push({ file: null, url: `asset://${item.id}`, previewUrl: item.url, name: item.id });
    }
    renderBatchImagePreviews();
  } else if (assetPickerTarget === "batchVideo") {
    const item = selectedItems[0];
    if (!item) return;
    batchFiles.video = null;
    batchTemplateVideoUrl = `asset://${item.id}`;
    const preview = document.getElementById("batch-video-preview");
    const dropText = document.querySelector('#batch-video-input')?.closest('.file-drop')?.querySelector('.drop-text');
    if (preview) preview.innerHTML = `<span class="file-tag video-preview-tag">资产: ${escapeHtml(item.id.slice(-12))}</span>`;
    if (dropText) dropText.style.display = "none";
  }

  closeAssetPicker();
}

// ========== Mosaic Panel ==========
function setupMosaicPanel() {
  const fileInput = document.getElementById("mosaic-file-input");
  const fileDrop = document.getElementById("mosaic-file-drop");
  const startBtn = document.getElementById("mosaic-start-btn");
  const strengthSlider = document.getElementById("mosaic-strength");
  const paddingSlider = document.getElementById("mosaic-padding");

  if (fileInput && fileDrop) {
    fileDrop.addEventListener("click", () => fileInput.click());
    fileDrop.addEventListener("dragover", (e) => { e.preventDefault(); fileDrop.classList.add("drag-over"); });
    fileDrop.addEventListener("dragleave", () => fileDrop.classList.remove("drag-over"));
    fileDrop.addEventListener("drop", (e) => {
      e.preventDefault();
      fileDrop.classList.remove("drag-over");
      if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        fileInput.dispatchEvent(new Event("change"));
      }
    });

    fileInput.addEventListener("change", () => {
      const file = fileInput.files[0];
      if (!file) return;
      const dropText = document.getElementById("mosaic-drop-text");
      const preview = document.getElementById("mosaic-file-preview");
      if (dropText) dropText.style.display = "none";
      if (preview) preview.innerHTML = `<span class="file-tag">${escapeHtml(file.name)}</span>`;
    });
  }

  if (strengthSlider) {
    strengthSlider.addEventListener("input", () => {
      document.getElementById("mosaic-strength-val").textContent = strengthSlider.value;
    });
  }

  if (paddingSlider) {
    paddingSlider.addEventListener("input", () => {
      const val = (parseFloat(paddingSlider.value) / 10).toFixed(1);
      document.getElementById("mosaic-padding-val").textContent = val;
    });
  }

  if (startBtn) {
    startBtn.addEventListener("click", startMosaicProcessing);
  }
}

async function startMosaicProcessing() {
  const fileInput = document.getElementById("mosaic-file-input");
  const statusEl = document.getElementById("mosaic-status");
  const startBtn = document.getElementById("mosaic-start-btn");

  if (!fileInput || !fileInput.files[0]) {
    statusEl.style.display = "block";
    statusEl.className = "status-message error";
    statusEl.textContent = "请先选择视频文件";
    return;
  }

  const file = fileInput.files[0];
  const strength = parseInt(document.getElementById("mosaic-strength").value);
  const padding = (parseFloat(document.getElementById("mosaic-padding").value) / 10).toFixed(1);

  startBtn.disabled = true;
  statusEl.style.display = "block";
  statusEl.className = "status-message info";
  statusEl.textContent = "正在上传视频...";

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("strength", strength);
    formData.append("padding", padding);

    const resp = await fetch("/api/mosaic/upload", { method: "POST", body: formData });
    const result = await resp.json();
    if (!resp.ok) {
      statusEl.className = "status-message error";
      statusEl.textContent = result.error || "上传失败";
      startBtn.disabled = false;
      return;
    }

    const taskId = result.task_id;
    statusEl.textContent = "正在处理中...";

    // Add task to mosaic task list
    addMosaicTask(taskId, result.filename);

    // Poll progress
    pollMosaicProgress(taskId);
  } catch (err) {
    statusEl.className = "status-message error";
    statusEl.textContent = "上传失败: " + err.message;
  }
  startBtn.disabled = false;
}

function addMosaicTask(taskId, filename) {
  const listEl = document.getElementById("mosaic-task-list");
  const emptyEl = document.getElementById("mosaic-empty");
  if (emptyEl) emptyEl.style.display = "none";

  const taskEl = document.createElement("div");
  taskEl.className = "mosaic-task-item";
  taskEl.id = `mosaic-task-${taskId}`;
  taskEl.innerHTML = `
    <div class="mosaic-task-info">
      <span class="mosaic-task-name">${escapeHtml(filename)}</span>
      <span class="mosaic-task-status" id="mosaic-status-${taskId}">处理中...</span>
    </div>
    <div class="mosaic-task-progress">
      <div class="batch-progress-container">
        <div class="batch-progress-bar" id="mosaic-bar-${taskId}" style="width:0%"></div>
      </div>
    </div>
    <div class="mosaic-task-actions" id="mosaic-actions-${taskId}"></div>
  `;
  if (listEl) listEl.prepend(taskEl);
}

function pollMosaicProgress(taskId) {
  const interval = setInterval(async () => {
    try {
      const resp = await fetch(`/api/mosaic/progress/${taskId}`);
      const data = await resp.json();

      const statusEl = document.getElementById(`mosaic-status-${taskId}`);
      const barEl = document.getElementById(`mosaic-bar-${taskId}`);
      const actionsEl = document.getElementById(`mosaic-actions-${taskId}`);

      if (statusEl) statusEl.textContent = data.message || data.status;
      if (barEl) barEl.style.width = (data.progress || 0) + "%";

      if (data.status === "done") {
        clearInterval(interval);
        if (statusEl) statusEl.textContent = "处理完成!";
        if (barEl) barEl.style.width = "100%";
        if (actionsEl) actionsEl.innerHTML = `<a href="/api/mosaic/download/${taskId}" class="btn-primary" download>下载结果</a>`;
        const mainStatus = document.getElementById("mosaic-status");
        if (mainStatus) {
          mainStatus.className = "status-message success";
          mainStatus.textContent = "处理完成!";
        }
      } else if (data.status === "error") {
        clearInterval(interval);
        if (statusEl) { statusEl.textContent = data.message || "处理失败"; statusEl.style.color = "var(--danger)"; }
        const mainStatus = document.getElementById("mosaic-status");
        if (mainStatus) {
          mainStatus.className = "status-message error";
          mainStatus.textContent = data.message || "处理失败";
        }
      }
    } catch (_) {}
  }, 2000);
}