/* Seedance 2.0 Video Generator - Frontend Logic */

// ---- State ----
let uploadedFiles = {
  firstFrame: null,   // {file, url, name}
  lastFrame: null,
  refImages: [],       // [{file, url, name}]
  refVideos: [],
  refAudios: [],
};
let pollTimers = {};
// openEdits: {taskId: {text: string, media: {images: [], videos: [], audios: []}}}
// 每个 media item: {url, role, name, preview?, file?}  url=null 表示新文件需上传
let openEdits = {};
let pollTimer = null;
let elapsedTimer = null;
let activeTab = "single";
let adminShowAll = true; // Admin: show all users' tasks by default
let adminFilterUser = ""; // Admin: filter by owner_username, "" = all

// ---- Batch State ----
let batchFiles = { images: [], video: null };
let batchFolderExpanded = {}; // Track expanded state of batch folders
let batchTemplateVideoUrl = ""; // Template video URL (skip upload when set)
let batchPresetCollection = null; // Active preset collection key (e.g. "preset_face_yoga")

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
    model: "seedance-2.0",
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
    name: "空镜1",
    model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 5,
    ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/cf1716cafb3e4d9e8ca43e82419ca13f.mp4",
  },
  tpl_kongjing_2: {
    name: "空镜2",
    model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 4,
    ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/85291f221b744a3bb73266bfdd11adf8.mp4",
  },
  tpl_kongjing_3: {
    name: "空镜3",
    model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 4,
    ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/b567c95f62ac42f6bbae61fb983a579a.mp4",
  },
  tpl_kongjing_4: {
    name: "空镜4",
    model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 5,
    ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/b0d5af1e656f4b4f8a97894dac000f5b.mp4",
  },
  tpl_kongjing_5: {
    name: "空镜5",
    model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 4,
    ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/819d0ae4370b4aeeb9fd1ae6de2f776f.mp4",
  },
  tpl_kongjing_6: {
    name: "空镜6",
    model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 4,
    ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/df519fccac1841acba5640f298d9d629.mp4",
  },
  tpl_kongjing_7: {
    name: "空镜7",
    model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 4,
    ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/26b91796e05646da8698ceab4f9675b8.mp4",
  },
  tpl_kongjing_8: {
    name: "空镜8",
    model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 4,
    ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/7b009fa581664157befed5c257761fa2.mp4",
  },
  tpl_kongjing_9: {
    name: "空镜9",
    model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 4,
    ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/49a986e55b3241a3a39a47aa8b1523b6.mp4",
  },
  tpl_kongjing_10: {
    name: "空镜10",
    model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 4,
    ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/8384aa93d90542eabaaa90c894a8590a.mp4",
  },
  tpl_kongjing_11: {
    name: "空镜11",
    model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 5,
    ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/da99a8b7f11845c4a6f9502551dc87fa.mp4",
  },
  tpl_kongjing_12: {
    name: "空镜12",
    model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 6,
    ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/d42e4a81fa6e4d3887e98597705a38dc.mp4",
  },
  tpl_kongjing_13: {
    name: "空镜13",
    model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 5,
    ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/73ec7488bf1f40b49d54a55b09f0c5a4.mp4",
  },
  tpl_kongjing_14: {
    name: "空镜14",
    model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 4,
    ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/eb9b5a1cfcfe4b229f48315c9579a90e.mp4",
  },
  tpl_kongjing_15: {
    name: "空镜15",
    model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 5,
    ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/07c930db3947498095a4cdd27585340b.mp4",
  },
  tpl_kongjing_16: {
    name: "空镜16",
    model: "seedance-2.0-fast",
    prompt: "请将视频一中的背景替换成图一，保持视频的前景不变，背景虚化，添加景深",
    duration: 4,
    ratio: "9:16",
    videoUrl: "https://zdeer-video.oss-cn-beijing.aliyuncs.com/seedance/templates/3e6376543eea43c49d6a6b2f92f256a9.mp4",
  },
};

// Preset collections: a single collection triggers ALL included templates per image
const PRESET_COLLECTIONS = {
  preset_face_yoga: {
    name: "面部瑜伽",
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
};

// Track previous task statuses for incremental rendering
let prevSingleTaskStatuses = {}; // Tracking for single tasks
let prevBatchTaskStatuses = {};  // Tracking for batch tasks

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
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Track videos currently being loaded/played to prevent re-render destroying them
const loadingVideoTasks = new Set();

// Lazy loading for videos
let videoObserver = null;
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

// ---- Init ----
document.addEventListener("DOMContentLoaded", () => {
  setupSidebar();
  setupModeSwitch();
  setupFileUploads();
  setupPromptCounter();
  setupGenerateButton();
  setupBatchUploads();
  setupBatchGenerateButton();
  setupMosaicPanel();
  setupAssetPage();
  
  // Batch folder delete buttons (event delegation)
  document.addEventListener('click', function(e) {
    console.log('Click detected, target:', e.target.className);
    const deleteBtn = e.target.closest('.btn-delete-folder-simple');
    if (deleteBtn) {
      console.log('Delete button clicked, batchId:', deleteBtn.getAttribute('data-delete-batch'));
      e.stopPropagation();
      e.preventDefault();
      const batchId = deleteBtn.getAttribute('data-delete-batch');
      if (batchId) {
        deleteFolderById(batchId);
      }
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
  
  loadTasks();

  // Setup admin panel
  setupAdminPanel();
  setupToggleAllTasks();
});

// ---- Helpers ----
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function friendlyError(msg) {
  if (!msg) return "生成失败，请重试";
  // Already contains Chinese — return as-is (backend already translated)
  if (/[\u4e00-\u9fff]/.test(msg)) return msg;
  const lower = msg.toLowerCase();
  // Real person detected (most common Seedance error)
  if (lower.includes("real person") && lower.includes("image"))
    return "上传的图片包含真人面部，平台暂不支持，请更换图片后重试";
  if (lower.includes("real person") && lower.includes("video"))
    return "上传的视频包含真人面部，平台暂不支持，请更换视频后重试";
  if (lower.includes("real person"))
    return "素材包含真人面部，平台暂不支持，请更换素材后重试";
  // Copyright restrictions
  if (lower.includes("copyright"))
    return "生成的视频可能涉及版权限制，请修改提示词或素材后重试";
  // Sensitive content
  if (lower.includes("sensitive") || lower.includes("output video may") || lower.includes("policyviolation"))
    return "生成的视频内容不符合安全规范，请修改提示词或素材后重试";
  // Video resolution too high
  if (lower.includes("pixel count"))
    return "参考视频分辨率过高，请压缩视频分辨率后重试";
  // Video file too large
  if (lower.includes("video size") && lower.includes("bytes"))
    return "参考视频文件太大，请压缩视频大小后重试（不超过50MB）";
  // Asset not found
  if (lower.includes("asset") && lower.includes("not found"))
    return "素材ID不存在或已失效，请检查后重试";
  // Parameter validation
  if (lower.includes("parameter") && lower.includes("not valid"))
    return "参数格式不正确，请检查上传的素材是否符合要求";
  // Content policy
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
  // Fallback: always show Chinese, never expose English to user
  return "生成失败，请重试";
}

function roleLabel(role) {
  const map = {
    first_frame: "首帧",
    last_frame: "尾帧",
    reference_image: "参考图",
    reference_video: "参考视频",
    reference_audio: "参考音频",
  };
  return map[role] || role || "参考";
}

function extractMediaFromTask(task) {
  const media = { images: [], videos: [], audios: [] };
  const content = (task.request_body || {}).content || [];
      if (batchId) {
        deleteFolderById(batchId);
      }
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
  
  loadTasks();

  // Setup admin panel
  setupAdminPanel();
  setupToggleAllTasks();
});

// ---- Helpers ----
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function friendlyError(msg) {
  if (!msg) return "生成失败，请重试";
  // Already contains Chinese — return as-is (backend already translated)
  if (/[\u4e00-\u9fff]/.test(msg)) return msg;
  const lower = msg.toLowerCase();
  // Real person detected (most common Seedance error)
  if (lower.includes("real person") && lower.includes("image"))
    return "上传的图片包含真人面部，平台暂不支持，请更换图片后重试";

// ---- Helpers ----
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function friendlyError(msg) {
  if (!msg) return "生成失败，请重试";
  // Already contains Chinese — return as-is (backend already translated)
  if (/[\u4e00-\u9fff]/.test(msg)) return msg;
  const lower = msg.toLowerCase();
  // Real person detected (most common Seedance error)
  if (lower.includes("real person") && lower.includes("image"))
    return "上传的图片包含真人面部，平台暂不支持，请更换图片后重试";
  if (lower.includes("real person") && lower.includes("video"))
    return "上传的视频包含真人面部，平台暂不支持，请更换视频后重试";
  if (lower.includes("real person"))
    return "素材包含真人面部，平台暂不支持，请更换素材后重试";
  // Copyright restrictions
  if (lower.includes("copyright"))
  if (lower.includes("real person"))
    return "素材包含真人面部，平台暂不支持，请更换素材后重试";
  // Copyright restrictions
  if (lower.includes("copyright"))
    return "生成的视频可能涉及版权限制，请修改提示词或素材后重试";
  // Sensitive content
  if (lower.includes("sensitive") || lower.includes("output video may") || lower.includes("policyviolation"))
    return "生成的视频内容不符合安全规范，请修改提示词或素材后重试";
  // Video resolution too high
  if (lower.includes("pixel count"))
    return "参考视频分辨率过高，请压缩视频分辨率后重试";
  // Video file too large
  if (lower.includes("video size") && lower.includes("bytes"))
    return "参考视频文件太大，请压缩视频大小后重试（不超过50MB）";
  // Asset not found
  if (lower.includes("asset") && lower.includes("not found"))
    return "素材ID不存在或已失效，请检查后重试";
  // Parameter validation
  if (lower.includes("parameter") && lower.includes("not valid"))
    return "参数格式不正确，请检查上传的素材是否符合要求";
  // Content policy
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
  // Fallback: always show Chinese, never expose English to user
  return "生成失败，请重试";
}

function roleLabel(role) {
  const map = {
    first_frame: "首帧",
    last_frame: "尾帧",
    reference_image: "参考图",
    reference_video: "参考视频",
    reference_audio: "参考音频",
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
function setupModeSwitch() {
  const modeSelect = document.getElementById("mode-select");
  modeSelect.addEventListener("change", updateUploadAreas);
  updateUploadAreas();
}

function updateUploadAreas() {
  const mode = document.getElementById("mode-select").value;

  // 隐藏所有上传区域
  document.querySelectorAll(".upload-area").forEach(el => el.style.display = "none");
  document.getElementById("web-search-section").style.display = "none";

  // 根据模式显示对应区域
  switch (mode) {
    case "text2video":
      document.getElementById("web-search-section").style.display = "block";
      break;
    case "img2video-first":
      document.getElementById("upload-area-first").style.display = "block";
    });
  });
}

// ---- 全屏编辑提示词 ----
function setupPromptExpand() {
  const expandBtn = document.getElementById('prompt-expand-btn');
  if (!expandBtn) return;

  expandBtn.addEventListener('click', () => {
    const promptInput = document.getElementById('prompt-input');
    const charCounter = document.getElementById('char-count');

    // 创建浮层
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

    // 自动聚焦并将光标移到末尾
    pfTextarea.focus();
    pfTextarea.setSelectionRange(pfTextarea.value.length, pfTextarea.value.length);

    // 实时同步
    pfTextarea.addEventListener('input', () => {
      promptInput.value = pfTextarea.value;
      promptInput.dispatchEvent(new Event('input'));
      pfCountNum.textContent = pfTextarea.value.length;
    });

    // 关闭浮层
    function closeOverlay() {
      promptInput.value = pfTextarea.value;
      promptInput.dispatchEvent(new Event('input'));
      overlay.remove();
    }

    pfClose.addEventListener('click', closeOverlay);
    pfDone.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeOverlay();
    });
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeOverlay();
    });
  });
}

function updateUploadAreas() {
  const mode = document.getElementById("mode-select").value;

  // 隐藏所有上传区域
  document.querySelectorAll(".upload-area").forEach(el => el.style.display = "none");
  document.getElementById("web-search-section").style.display = "none";

  // 根据模式显示对应区域
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

  // 切换模式时重置所有上传
  resetUploadedFiles();
}

    case "multimodal":
      document.getElementById("upload-area-ref-images").style.display = "block";
      document.getElementById("upload-area-ref-videos").style.display = "block";
      document.getElementById("upload-area-ref-audios").style.display = "block";
      break;
  }

  // 切换模式时重置所有上传
  resetUploadedFiles();
}

function resetUploadedFiles() {
  uploadedFiles = {
    firstFrame: null,
    lastFrame: null,
    refImages: [],
    refVideos: [],
    refAudios: [],
  };
  document.querySelectorAll(".file-preview, .file-preview-list").forEach(el => el.innerHTML = "");
  document.querySelectorAll(".drop-text").forEach(el => el.style.display = "");
}

// ---- File Uploads ----
function setupFileUploads() {
  setupSingleFileUpload("first-frame-input", "first-frame-preview", "firstFrame", "image");
  setupSingleFileUpload("last-frame-input", "last-frame-preview", "lastFrame", "image");

  setupMultiFileUpload("ref-images-input", "ref-images-preview", "refImages", "image", 9);
  setupMultiFileUpload("ref-videos-input", "ref-videos-preview", "refVideos", "video", 3);
  setupMultiFileUpload("ref-audios-input", "ref-audios-preview", "refAudios", "audio", 3);

  document.querySelectorAll(".file-drop").forEach(drop => {
    drop.addEventListener("click", (e) => {
      if (e.target.closest(".preview-remove")) return;
      const targetId = drop.dataset.target;
      document.getElementById(targetId).click();
    });

    drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("drag-over"); });
    drop.addEventListener("dragleave", () => drop.classList.remove("drag-over"));
    drop.addEventListener("drop", (e) => {
      e.preventDefault();
      drop.classList.remove("drag-over");
      const targetId = drop.dataset.target;
      const input = document.getElementById(targetId);
      input.files = e.dataTransfer.files;
      input.dispatchEvent(new Event("change"));
    });
  });
}

function setupSingleFileUpload(inputId, previewId, stateKey, type) {
  const input = document.getElementById(inputId);
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
  });
}

function setupMultiFileUpload(inputId, previewId, stateKey, type, maxCount) {
  const input = document.getElementById(inputId);
function setupPromptCounter() {
  const textarea = document.getElementById("prompt-input");
  const counter = document.getElementById("char-count");
  textarea.addEventListener("input", () => {
    counter.textContent = textarea.value.length;
  });
}

// ---- Upload file to OSS (with retry) ----
async function uploadToOSS(file, maxRetries = 3) {
  console.log("Uploading file:", file.name, "size:", file.size);
  const formData = new FormData();
  formData.append("file", file);

  let lastError = null;

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

    if (uploadedFiles[stateKey].length > 0) {
      dropText.style.display = "none";
    }

    input.value = "";
  });
}

function removeMultiFile(stateKey, index, previewId) {
  uploadedFiles[stateKey].splice(index, 1);
  rebuildMultiPreview(stateKey, previewId);
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
      // URL-based item (preloaded from task or asset picker)
      const displayUrl = item.previewUrl || item.url;
      const isAsset = item.url.startsWith('asset://');
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

// ---- Prompt Counter ----
function setupPromptCounter() {
  const textarea = document.getElementById("prompt-input");
  const counter = document.getElementById("char-count");
  textarea.addEventListener("input", () => {
    counter.textContent = textarea.value.length;
  });
}

// ---- Upload file to OSS (with retry) ----
async function uploadToOSS(file, maxRetries = 3) {
  console.log("Uploading file:", file.name, "size:", file.size);
  const formData = new FormData();
  formData.append("file", file);

  let lastError = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      const resp = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      console.log("Upload response:", resp.status, resp.statusText);
      if (!resp.ok) {
        let errMsg = "文件上传失败";
        try {
          const err = await resp.json();
          errMsg = err.error || errMsg;
        } catch (_) {
          errMsg = `文件上传失败 (HTTP ${resp.status})`;
        }
        throw new Error(errMsg);
      }
      const result = await resp.json();
      console.log("Upload success, URL:", result.url);
      return result.url;
    } catch (err) {
      lastError = err;
      console.warn(`Upload attempt ${attempt}/${maxRetries} failed for ${file.name}:`, err.message);
      if (attempt < maxRetries) {
  throw new Error(`上传失败 (${file.name}): ${lastError.message}`);
}

// ---- Generate Video ----
function setupGenerateButton() {
  document.getElementById("generate-btn").addEventListener("click", generateVideo);
  document.getElementById("refresh-btn").addEventListener("click", loadTasks);
}

async function generateVideo() {
  const btn = document.getElementById("generate-btn");

  const mode = document.getElementById("mode-select").value;
  const prompt = document.getElementById("prompt-input").value.trim();

  const hasRefMedia = uploadedFiles.refImages.length > 0 || uploadedFiles.refVideos.length > 0;
  if (mode === "text2video" && !prompt) {
    showStatus("error", "文生视频模式需要输入提示词");
    return;
  }
  if (mode === "img2video-first" && !uploadedFiles.firstFrame) {
    showStatus("error", "请上传首帧图片");
    return;
  }
  if (mode === "img2video-firstlast" && (!uploadedFiles.firstFrame || !uploadedFiles.lastFrame)) {
    showStatus("error", "请上传首帧和尾帧图片");
    return;
  }
  if (mode === "multimodal" && !hasRefMedia) {
    showStatus("error", "多模态模式至少需要上传一张参考图片或一个参考视频");
    return;
  }

  btn.disabled = true;
  showStatus("info", "正在上传文件...");

  try {
    const images = [];
    const videos = [];
    const audios = [];


















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
  const { budget, spent, remaining } = userBudgetData;




    } else {
      showStatus("success", `已成功提交 ${successCount} 个任务!`);
    }
    btn.disabled = false;
    loadTasks();

  } catch (err) {
    showStatus("error", friendlyError(err.message));
  el.className = `status-message ${type}`;
  el.textContent = message;
}

// ---- Load and render tasks ----
let cachedTasks = [];

let prevHadRunning = false;
let deletedSuccessTotal = 0;
let deletedSuccessByUser = {};

// Debounced loadTasks to prevent rapid successive calls
const debouncedLoadTasks = debounce(async () => {
  try {
    const url = adminShowAll ? "/api/tasks" : "/api/tasks?mine=1";
    const resp = await fetch(url);
    if (!resp.ok) {
      if (resp.status === 429) {
        console.warn("Rate limited, will retry later");
        // Back off polling when rate limited
        setTimeout(schedulePolling, 10000);
        return;
      }
      throw new Error(`HTTP ${resp.status}`);
    }
    const data = await resp.json();
    if (Array.isArray(data)) {
      cachedTasks = data;
    } else {
      cachedTasks = data.tasks || [];
      deletedSuccessTotal = data.deleted_success_total || 0;
      deletedSuccessByUser = data.deleted_success_by_user || {};
    }
    renderCurrentTasks();
  } catch (err) {
    console.error("Failed to load tasks:", err);
  }
  // 无论成功还是失败都继续调度轮询
  schedulePolling();
}, 500);

async function loadTasks() {
  debouncedLoadTasks();
}

function schedulePolling() {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  
  // Don't poll if page is hidden (background tab)
  if (document.hidden) {
    pollTimer = setTimeout(schedulePolling, 5000);
    return;
  }
  
  const hasRunning = cachedTasks.some(t => t.status === "pending" || t.status === "queued" || t.status === "running" || t.status === "downloading");
  if (hasRunning) {
    prevHadRunning = true;
    pollTimer = setTimeout(loadTasks, 5000);
  } else if (prevHadRunning) {
    // 任务刚从运行态变为终止态，再做一次刷新确保拿到最终结果
    prevHadRunning = false;
    pollTimer = setTimeout(loadTasks, 2000);
  }
  // If no running tasks and prevHadRunning is false, stop polling until user refreshes manually
}

function startElapsedTimer() {
  if (elapsedTimer) return;
  elapsedTimer = setInterval(() => {
    const els = document.querySelectorAll(".gen-elapsed[data-created]");
    if (els.length === 0) {
      clearInterval(elapsedTimer);
      elapsedTimer = null;
      return;
    }
    const now = Math.floor(Date.now() / 1000);
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
  // Check fullscreen first
  if (document.fullscreenElement || document.webkitFullscreenElement) return true;
  // Only use the explicit flag set - no unreliable DOM state checks
  if (loadingVideoTasks.size > 0) return true;
  return false;
}

function renderCurrentTasks() {
  // Skip DOM rebuild while a video is playing or in fullscreen to prevent flash-exit
  if (isVideoPlaying()) {
    // Still update lightweight counters without touching DOM structure
    const displayTasks = (adminShowAll && adminFilterUser)
      ? cachedTasks.filter(t => t.owner_username === adminFilterUser)
      : cachedTasks;
    document.getElementById("batch-count").textContent = displayTasks.filter(t => t.batch_id).length;
    document.getElementById("single-count").textContent = displayTasks.filter(t => !t.batch_id).length;
    return;
  }

  // Admin filter: update user filter dropdown and apply filter
  updateAdminUserFilter();
  let displayTasks = cachedTasks;
  if (adminShowAll && adminFilterUser) {
    displayTasks = cachedTasks.filter(t => t.owner_username === adminFilterUser);
  }

  // Separate batch tasks and single tasks
  const batchTasks = displayTasks.filter(t => t.batch_id);
  const singleTasks = displayTasks.filter(t => !t.batch_id);
  
  // Update counts
  document.getElementById("batch-count").textContent = batchTasks.length;
  document.getElementById("single-count").textContent = singleTasks.length;
  
  // Show/hide sections based on data and active tab
  const batchSection = document.getElementById("batch-section");
  const singleSection = document.getElementById("single-section");
  const divider = document.getElementById("section-divider");
  const globalEmpty = document.getElementById("global-empty");
  
  // If not on single/batch tab, don't touch section visibility at all
  if (activeTab !== "single" && activeTab !== "batch") {
    return;
  }

  const hasBatch = batchTasks.length > 0;
  const hasSingle = singleTasks.length > 0;
  
  // Handle global empty state
  if (!hasBatch && !hasSingle) {
    batchSection.style.display = "none";
    singleSection.style.display = "none";
    divider.style.display = "none";
    globalEmpty.style.display = "block";
    return;
  }
  
  globalEmpty.style.display = "none";
  
  // Filter display based on active tab
  const showBatchOnly = activeTab === "batch";
  const showSingleOnly = activeTab === "single";
  
  // Render batch section (only show in batch tab)
  if (hasBatch && !showSingleOnly) {
    batchSection.style.display = "block";
    renderBatchFolders(batchTasks);
  } else {
    batchSection.style.display = "none";
    document.getElementById("batch-folders-list").innerHTML = '';
  }
  
  // Render single section (only show in single tab)
  if (hasSingle && !showBatchOnly) {
    singleSection.style.display = "block";
    renderTasks(singleTasks);
  } else {
    singleSection.style.display = "none";
    document.getElementById("video-list").innerHTML = '<div class="empty-state">暂无单个任务</div>';
  }
  
  // Show divider only when both sections are visible (should not happen with tab filtering)
  divider.style.display = "none";
  
  // 如果有运行中的任务，启动本地计时器
  const hasRunning = cachedTasks.some(t => ["pending", "queued", "running", "downloading"].includes(t.status));
  if (hasRunning) {
    startElapsedTimer();
  }
  // Setup lazy loading for videos after rendering
  setupVideoLazyLoading();
  document.querySelectorAll('video[data-src]').forEach(video => {
    videoObserver.observe(video);
  });
}

// Render batch tasks grouped by folders
function renderBatchFolders(batchTasks) {
  const list = document.getElementById("batch-folders-list");
  const batchEmpty = document.getElementById("batch-empty");
  
  if (batchTasks.length === 0) {
    list.style.display = "none";
    batchEmpty.style.display = "block";
    return;
  }
  
  list.style.display = "block";
  batchEmpty.style.display = "none";
  
  // Group by batch_id
  const folders = {};
  batchTasks.forEach(task => {
    const bid = task.batch_id;
    if (!folders[bid]) {
      folders[bid] = {
        name: task.batch_folder_name || `批量任务 ${bid.slice(-6)}`,
        createdAt: task.batch_created_at || new Date(task.created_at * 1000).toISOString(),
        tasks: []
      };
    }
    folders[bid].tasks.push(task);
  });
  
  // Sort folders by creation time (newest first)
  const sortedFolders = Object.entries(folders).sort((a, b) => {
    return new Date(b[1].createdAt) - new Date(a[1].createdAt);
  });
  
  // Render folders
  list.innerHTML = sortedFolders.map(([bid, folder]) => {
    const tasks = folder.tasks;
    const total = tasks.length;
    const done = tasks.filter(t => t.status === "succeeded").length;
    const failed = tasks.filter(t => ["failed", "expired", "cancelled", "timeout"].includes(t.status)).length;
    const running = tasks.filter(t => ["pending", "queued", "running", "downloading"].includes(t.status)).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    const isExpanded = batchFolderExpanded[bid] || false;
    
    return `
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
      </div>
    `;
  }).join('');
}

// Toggle select all tasks in a batch
function toggleSelectAll(batchId, checked) {
  const folder = document.querySelector(`[data-batch-id="${batchId}"]`);
  if (folder) {
    const checkboxes = folder.querySelectorAll('.batch-task-checkbox');
    checkboxes.forEach(cb => cb.checked = checked);
  }
}

// Delete selected tasks in a batch
async function deleteSelectedTasks(batchId) {
  const folder = document.querySelector(`[data-batch-id="${batchId}"]`);
  if (!folder) return;
  
  const checkboxes = folder.querySelectorAll('.batch-task-checkbox:checked');
  const taskIds = Array.from(checkboxes).map(cb => cb.getAttribute('data-task-id'));
  
  if (taskIds.length === 0) {
    alert("请先选择要删除的任务");
    return;
  }
  
  if (!confirm(`确定删除选中的 ${taskIds.length} 个任务？`)) return;
  
  let deleted = 0;
  let failed = 0;
  for (const id of taskIds) {
    try {
      const r = await fetch(`/api/delete-task/${id}`, { method: "DELETE" });
    pollTimer = null;
  }
  




















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






























  const overlay = document.createElement('div');
  overlay.className = 'video-preview-overlay';
  let contentHtml = '';
  if (mediaType === 'video') {
    contentHtml = `<video controls autoplay src="${src}" style="max-width:90vw;max-height:80vh;border-radius:8px;"></video>`;
  } else {
    contentHtml = `<img src="${src}" style="max-width:90vw;max-height:80vh;border-radius:8px;object-fit:contain;">`;
  }
  overlay.innerHTML = `
    <div class="video-preview-modal">
      <button class="vp-close">&times;</button>
      ${contentHtml}
      <div class="vp-name">${escapeHtml(item.name || '')}</div>
    </div>
  `;
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

function previewRefVideo(stateKey, index) {
  const item = uploadedFiles[stateKey] && uploadedFiles[stateKey][index];
  if (!item) return;

  let src = null;
  let isObjectUrl = false;
  if (item.file) {
    src = URL.createObjectURL(item.file);
    isObjectUrl = true;
  } else if (item.url) {
    src = item.url;
  }
  if (!src) return;

  // Close any existing preview modal first
  const existing = document.querySelector('.video-preview-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'video-preview-overlay';
  overlay.innerHTML = `
    <div class="video-preview-modal">
      <button class="vp-close">&times;</button>
      <video controls autoplay src="${src}"></video>
      <div class="vp-name">${escapeHtml(item.name || '')}</div>
    </div>
  `;
  document.body.appendChild(overlay);

  function closePreview() {
  function onKey(e) { if (e.key === 'Escape') closePreview(); }
  document.addEventListener('keydown', onKey);
  overlay.querySelector('.vp-close').addEventListener('click', closePreview);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closePreview(); });
}

function playVideo(thumbnailEl, taskId) {
  // Mark this task to prevent page re-render destroying the video
  loadingVideoTasks.add(taskId);

  const container = thumbnailEl.parentElement;
  const video = container.querySelector('video');

  // Set video source (lazy loading may not have triggered yet)
  if (video.dataset.src) {
    video.src = video.dataset.src;
    video.removeAttribute('data-src');
  } else if (!video.src) {
    video.src = '/api/video/' + taskId;
  }

  // Immediately swap: poster attribute shows thumbnail while video buffers
  thumbnailEl.style.display = 'none';
  video.style.display = 'block';
  video.load();
  video.play().catch(e => console.log('Auto-play prevented:', e));

  // Clear protection when video ends, pauses, or errors
  function clearProtection() { loadingVideoTasks.delete(taskId); }
  video.addEventListener('ended', clearProtection, { once: true });
  video.addEventListener('pause', clearProtection, { once: true });
  video.addEventListener('error', clearProtection, { once: true });

  // Safety: always clear after 15s (videos are 5-10s max)
  setTimeout(clearProtection, 15000);
}

// Download video file
function downloadVideo(taskId) {
  const a = document.createElement('a');
  a.href = '/api/video/' + taskId + '/download';
  a.download = taskId + '.mp4';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Toggle batch folder expansion
function toggleBatchFolder(batchId) {
  batchFolderExpanded[batchId] = !batchFolderExpanded[batchId];
  const el = document.getElementById(`batch-folder-tasks-${batchId}`);
  if (el) {
    el.classList.toggle('expanded');
  }
}

// Toggle all batch folders
function toggleAllBatchFolders() {
  const list = document.getElementById("batch-folders-list");
  const isHidden = list.style.display === "none";
  list.style.display = isHidden ? "block" : "none";
  document.getElementById("toggle-batch-folders").textContent = isHidden ? "收起" : "展开";
}

function renderTasks(tasks) {
  const container = document.getElementById("video-list");

  // 渲染前保存正在编辑的提示词文本
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

  // Always use full re-render for single tasks to ensure clean separation from batch tasks
  container.innerHTML = tasks.map(task => renderTaskCard(task)).join("");
  tasks.forEach(t => { prevSingleTaskStatuses[t.id] = t.status; });
}

function renderTaskCard(task) {
  const statusLabels = {
    pending: "等待提交",
    queued: "排队中",
    running: "生成中",
    downloading: "下载中",
    succeeded: "已完成",
    failed: "失败",
    expired: "已超时",
    cancelled: "已取消",
    timeout: "查询超时",
  };
  
  // Debug: log status changes
  if (window.location.search.includes('debug')) {
    console.log(`Task ${task.id}: status=${task.status}, seedance_id=${task.seedance_task_id || 'none'}`);
  }

  const statusLabel = statusLabels[task.status] || task.status;
  const time = new Date(task.created_at * 1000).toLocaleString("zh-CN");
  const isCompleted = task.status === "succeeded";
  const isFailed = ["failed", "expired", "cancelled", "timeout"].includes(task.status);
  const isRunning = ["pending", "queued", "running", "downloading"].includes(task.status);

  let videoHtml;
  if (isCompleted && task.local_path) {
    // Use thumbnail as preview image if available
    const hasThumbnail = task.thumbnail_path;
    const thumbnailUrl = hasThumbnail ? `/api/thumbnail/${task.id}` : "";
    const posterUrl = hasThumbnail ? thumbnailUrl : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 16 9'%3E%3Crect fill='%23222' width='100%25' height='100%25'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-size='14'%3E点击播放%3C/text%3E%3C/svg%3E";
    
    // Show thumbnail with play button overlay, click to play video
    // Use object-fit:contain to preserve aspect ratio
    videoHtml = `
      <div class="video-thumbnail-preview" onclick="playVideo(this, '${task.id}')" style="cursor:pointer;position:relative;width:100%;height:100%;background:#000;display:flex;align-items:center;justify-content:center;">
        <img src="${posterUrl}" style="max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;" onerror="this.style.display='none'">
        <div class="play-overlay" style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.3);transition:background 0.2s;">
          <div class="play-button" style="width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.3);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 5V19L19 12L8 5Z" fill="#333"/>
            </svg>
          </div>
        </div>
      </div>
      <video controls preload="none" data-src="/api/video/${task.id}" poster="${posterUrl}" style="display:none;background:#000;"></video>
    `;
  } else if (isRunning) {
    const elapsed = Math.floor(Date.now() / 1000) - task.created_at;
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const elapsedStr = mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`;

    const steps = [
      { key: "pending", label: "等待" },
      { key: "queued", label: "排队" },
      { key: "running", label: "生成" },
      { key: "downloading", label: "下载" },
    ];
    const currentIdx = steps.findIndex(s => s.key === task.status);

    const stepsHtml = steps.map((s, i) => {
      let cls = "step-pending";
      if (i < currentIdx) cls = "step-done";
      else if (i === currentIdx) cls = "step-active";
      return `<span class="gen-step ${cls}">${s.label}</span>`;
    }).join('<span class="step-arrow">&rarr;</span>');

    videoHtml = `
      <div class="video-placeholder gen-status">
        <div class="spinner"></div>
        <div class="gen-status-text">${statusLabel}...</div>
        <div class="gen-steps">${stepsHtml}</div>
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

  // 构建编辑区的媒体预览
  let mediaHtml = "";
  if (isEditing && editState.media) {
    const m = editState.media;
    let rows = "";

    // 图片行
    if (m.images.length > 0) {
      const items = m.images.map((img, i) =>
        `<div class="edit-media-item">
          <img src="${escapeHtml(img.preview || img.url)}" title="${escapeHtml(img.name)}">
          <span class="edit-media-role">${escapeHtml(roleLabel(img.role))}</span>
          <button class="edit-media-remove" onclick="editRemoveMedia('${task.id}','images',${i})">&times;</button>
        </div>`
      ).join("");
      const items = m.images.map((img, i) =>
        `<div class="edit-media-item">
          <img src="${escapeHtml(img.preview || img.url)}" title="${escapeHtml(img.name)}">
          <span class="edit-media-role">${escapeHtml(roleLabel(img.role))}</span>
          <button class="edit-media-remove" onclick="editRemoveMedia('${task.id}','images',${i})">&times;</button>
        </div>`
      ).join("");
      rows += `<div class="edit-media-row"><span class="edit-media-label">图片</span>${items}</div>`;
    }

    // 视频行
    if (m.videos.length > 0) {
      const items = m.videos.map((vid, i) =>
        `<div class="edit-media-item">
          <span class="file-tag">${escapeHtml(vid.name)}</span>
          <button class="edit-media-remove" onclick="editRemoveMedia('${task.id}','videos',${i})">&times;</button>
        </div>`
      ).join("");
      rows += `<div class="edit-media-row"><span class="edit-media-label">视频</span>${items}</div>`;
    }

    // 音频行
    if (m.audios.length > 0) {
      const items = m.audios.map((aud, i) =>
        `<div class="edit-media-item">
          <span class="file-tag">${escapeHtml(aud.name)}</span>
          <button class="edit-media-remove" onclick="editRemoveMedia('${task.id}','audios',${i})">&times;</button>
        </div>`
      ).join("");
      rows += `<div class="edit-media-row"><span class="edit-media-label">音频</span>${items}</div>`;
    }

    // 添加按钮 + 隐藏 file input
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
  
  return `
    <div class="video-card" id="card-${task.id}">
      ${batchCheckbox}
      <div class="video-wrapper">${videoHtml}</div>
      <div class="card-body">
        <div class="card-meta">
          <span class="card-model">${escapeHtml(task.model)}</span>${task.batch_id ? `<span class="batch-badge">批量 ${(task.batch_index || 0) + 1}/${task.batch_total || "?"}</span>` : ""}
          <span class="status-badge ${task.status}">${statusLabel}</span>${task.owner_username ? `<span class="task-owner-badge">${escapeHtml(task.owner_username)}</span>` : ""}
          <span class="card-time">${time}</span>
        </div>
        <div class="card-prompt">${promptDisplay}</div>
        ${editSection}
        <div class="card-actions">${actionsHtml}</div>
      </div>
    </div>
  `;
}

// ---- Re-edit: populate left panel form ----
function editTaskInPanel(taskId) {
  const task = cachedTasks.find(t => t.id === taskId);
  if (!task) {
    showStatus("error", "任务未找到");
    return;
  }

  // 1. Switch to single page via sidebar
  document.querySelectorAll(".sidebar-item").forEach(b => b.classList.remove("active"));
  const singleBtn = document.querySelector('.sidebar-item[data-page="single"]');










    <div class="card-edit ${isEditing ? 'active' : ''}" id="edit-${task.id}">
      <textarea rows="3">${escapeHtml(editText)}</textarea>
      ${mediaHtml}
      <div class="card-actions">
        <button onclick="cancelEdit('${task.id}')">取消</button>
        <button class="btn-primary" onclick="regenerateTask('${task.id}', this)">重新生成</button>
      </div>
    </div>
  ` : "";



















































































































  const batchCheckbox = task.batch_id ? `<input type="checkbox" class="batch-task-checkbox" data-task-id="${task.id}" data-batch-id="${task.batch_id}">` : '';
  
  return `
    <div class="video-card" id="card-${task.id}">
      ${batchCheckbox}
      <div class="video-wrapper">${videoHtml}</div>
      <div class="card-body">
        <div class="card-meta">
          <span class="card-model">${escapeHtml(task.model)}</span>${task.batch_id ? `<span class="batch-badge">批量 ${(task.batch_index || 0) + 1}/${task.batch_total || "?"}</span>` : ""}
          <span class="status-badge ${task.status}">${statusLabel}</span>${task.owner_username ? `<span class="task-owner-badge">${escapeHtml(task.owner_username)}</span>` : ""}
          <span class="card-time">${time}</span>
        </div>
        <div class="card-prompt">${promptDisplay}</div>
        ${editSection}
        <div class="card-actions">${actionsHtml}</div>
      </div>
    </div>
  `;
}

// ---- Re-edit: populate left panel form ----
function editTaskInPanel(taskId) {
  const task = cachedTasks.find(t => t.id === taskId);
  if (!task) {
    showStatus("error", "任务未找到");
  activeTab = "single";
  document.querySelectorAll(".page-content").forEach(p => p.classList.remove("active"));
  document.getElementById("page-single").classList.add("active");
  const mosaicSection = document.getElementById("mosaic-section");
  const panelHeader = document.querySelector('.panel-right-header');







  if (singleSection) singleSection.style.display = "block";

  // 2. Set model
  const modelSelect = document.getElementById("model-select");
  if (task.model && modelSelect) modelSelect.value = task.model;

  // 3. Set mode (without triggering reset)
  const modeSelect = document.getElementById("mode-select");
  const mode = task.mode || "text2video";
  if (modeSelect) modeSelect.value = mode;

  // 4. Show upload areas based on mode (without calling updateUploadAreas which resets files)
  document.querySelectorAll(".upload-area").forEach(el => el.style.display = "none");
  document.getElementById("web-search-section").style.display = "none";
  switch (mode) {































































  
  return `
    <div class="video-card" id="card-${task.id}">
      ${batchCheckbox}
      <div class="video-wrapper">${videoHtml}</div>
      <div class="card-body">
        <div class="card-meta">
          <span class="card-model">${escapeHtml(task.model)}</span>${task.batch_id ? `<span class="batch-badge">批量 ${(task.batch_index || 0) + 1}/${task.batch_total || "?"}</span>` : ""}
          <span class="status-badge ${task.status}">${statusLabel}</span>${task.owner_username ? `<span class="task-owner-badge">${escapeHtml(task.owner_username)}</span>` : ""}
          <span class="card-time">${time}</span>
        </div>
        <div class="card-prompt">${promptDisplay}</div>
        ${editSection}
        <div class="card-actions">${actionsHtml}</div>
      </div>




























































        if (vid.url) {
          videos.push({ url: vid.url, role: vid.role });
        } else if (vid.file) {
          if (btnEl) btnEl.textContent = `上传视频 ${i + 1}/${media.videos.length}...`;
          const url = await uploadToOSS(vid.file);
function setupSidebar() {
  document.querySelectorAll('.sidebar-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const page = btn.dataset.page;
      activeTab = page;

      // Switch left panel content
      document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
      const target = document.getElementById('page-' + page) || document.getElementById(page + '-panel');
      if (target) target.classList.add('active');

      // Switch right panel sections
      const batchSection = document.getElementById('batch-section');
      const singleSection = document.getElementById('single-section');
      const sectionDivider = document.getElementById('section-divider');
      const mosaicSection = document.getElementById('mosaic-section');
      const assetSection = document.getElementById('asset-section');
      const globalEmpty = document.getElementById('global-empty');
      const panelHeader = document.querySelector('.panel-right-header');

      if (page === 'mosaic') {
        if (batchSection) batchSection.style.display = 'none';
        if (singleSection) singleSection.style.display = 'none';
        if (sectionDivider) sectionDivider.style.display = 'none';
        if (globalEmpty) globalEmpty.style.display = 'none';
        if (mosaicSection) mosaicSection.style.display = 'block';
        if (assetSection) assetSection.style.display = 'none';
        if (panelHeader) panelHeader.style.display = 'none';
        renderMosaicTasks();
      } else if (page === 'assets') {
        if (batchSection) batchSection.style.display = 'none';
        if (singleSection) singleSection.style.display = 'none';
        if (sectionDivider) sectionDivider.style.display = 'none';
        if (globalEmpty) globalEmpty.style.display = 'none';
        if (mosaicSection) mosaicSection.style.display = 'none';
        if (assetSection) assetSection.style.display = 'block';
        if (panelHeader) panelHeader.style.display = 'none';
        loadAssets();
      } else {
        if (mosaicSection) mosaicSection.style.display = 'none';
        if (assetSection) assetSection.style.display = 'none';
        if (panelHeader) panelHeader.style.display = '';
        if (page === 'single') {
          if (batchSection) batchSection.style.display = 'none';
          if (sectionDivider) sectionDivider.style.display = 'none';
          if (singleSection) singleSection.style.display = 'block';
        } else if (page === 'batch') {
          if (singleSection) singleSection.style.display = 'none';
          if (sectionDivider) sectionDivider.style.display = 'none';
          if (batchSection) batchSection.style.display = 'block';
        }
        renderCurrentTasks();
      }
    });
  });
}

// ========== Batch File Uploads ==========
function setupBatchUploads() {
  // Batch panel may not exist for sub-accounts
  const folderInput = document.getElementById("batch-images-input");
  if (!folderInput) return;

  // ---- Template selection ----
  const tplSelect = document.getElementById("batch-template-select");
  if (tplSelect) {
    tplSelect.addEventListener("change", () => {
      const tplKey = tplSelect.value;
      const videoPreview = document.getElementById("batch-video-preview");
      const videoDrop = videoPreview.closest(".file-drop");

      // Check if it's a preset collection
      if (PRESET_COLLECTIONS[tplKey]) {
        const preset = PRESET_COLLECTIONS[tplKey];
        batchPresetCollection = tplKey;
        batchTemplateVideoUrl = "__preset__"; // Marker: video comes from each sub-template
        batchFiles.video = null;
        // Lock all fields (each sub-template has its own settings)
        document.getElementById("batch-model-select").disabled = true;
        document.getElementById("batch-prompt-input").value = `[预设合集] ${preset.name} - 包含 ${preset.templates.length} 个模版，每张图片将自动生成 ${preset.templates.length} 个任务`;
        document.getElementById("batch-prompt-input").disabled = true;
        document.getElementById("batch-duration-select").disabled = true;
        document.getElementById("batch-ratio-select").disabled = true;
        // Show preset info in video area
        videoPreview.innerHTML = `<span class="file-tag" style="color:var(--accent);">预设合集: ${escapeHtml(preset.name)}（${preset.templates.length} 个模版）</span>`;
        videoDrop.querySelector(".drop-text").style.display = "none";
        videoDrop.style.pointerEvents = "none";
        videoDrop.style.opacity = "0.6";
        // Auto-fill folder name
        document.getElementById("batch-folder-name").value = preset.name;
        return;
      }

      // Reset preset collection state
      batchPresetCollection = null;

      if (!tplKey || !BATCH_TEMPLATES[tplKey]) {
        // Reset to manual mode
        batchTemplateVideoUrl = "";
        document.getElementById("batch-model-select").disabled = false;
        document.getElementById("batch-prompt-input").disabled = false;
        document.getElementById("batch-prompt-input").value = "";
        document.getElementById("batch-duration-select").disabled = false;
        document.getElementById("batch-ratio-select").disabled = false;
        // Clear template video preview
        videoPreview.innerHTML = "";
        videoDrop.querySelector(".drop-text").style.display = "";
        videoDrop.style.pointerEvents = "";
        videoDrop.style.opacity = "";
        batchFiles.video = null;
        return;
      }
      const tpl = BATCH_TEMPLATES[tplKey];
      // Fill template values
      document.getElementById("batch-model-select").value = tpl.model;
      document.getElementById("batch-prompt-input").value = tpl.prompt;
      document.getElementById("batch-duration-select").value = String(tpl.duration);
      document.getElementById("batch-ratio-select").value = tpl.ratio;
      const videoDrop = videoPreview.closest(".file-drop");

      // Check if it's a preset collection
      if (PRESET_COLLECTIONS[tplKey]) {
        const preset = PRESET_COLLECTIONS[tplKey];
        batchPresetCollection = tplKey;
        batchTemplateVideoUrl = "__preset__"; // Marker: video comes from each sub-template
        batchFiles.video = null;
        // Lock all fields (each sub-template has its own settings)
        document.getElementById("batch-model-select").disabled = true;
        document.getElementById("batch-prompt-input").value = `[预设合集] ${preset.name} - 包含 ${preset.templates.length} 个模版，每张图片将自动生成 ${preset.templates.length} 个任务`;
        document.getElementById("batch-prompt-input").disabled = true;
        document.getElementById("batch-duration-select").disabled = true;
        document.getElementById("batch-ratio-select").disabled = true;
        // Show preset info in video area
        videoPreview.innerHTML = `<span class="file-tag" style="color:var(--accent);">预设合集: ${escapeHtml(preset.name)}（${preset.templates.length} 个模版）</span>`;
        videoDrop.querySelector(".drop-text").style.display = "none";
        videoDrop.style.pointerEvents = "none";
        videoDrop.style.opacity = "0.6";
        // Auto-fill folder name
        document.getElementById("batch-folder-name").value = preset.name;
        return;
      }

      // Reset preset collection state
      batchPresetCollection = null;

      if (!tplKey || !BATCH_TEMPLATES[tplKey]) {
        // Reset to manual mode
        batchTemplateVideoUrl = "";
        document.getElementById("batch-model-select").disabled = false;
        document.getElementById("batch-prompt-input").disabled = false;
        document.getElementById("batch-prompt-input").value = "";
        document.getElementById("batch-duration-select").disabled = false;
        document.getElementById("batch-ratio-select").disabled = false;
        // Clear template video preview
        videoPreview.innerHTML = "";
        videoDrop.querySelector(".drop-text").style.display = "";
        videoDrop.style.pointerEvents = "";
        videoDrop.style.opacity = "";
        batchFiles.video = null;
        return;
      }
      const tpl = BATCH_TEMPLATES[tplKey];
      // Fill template values
      document.getElementById("batch-model-select").value = tpl.model;
      document.getElementById("batch-prompt-input").value = tpl.prompt;
      document.getElementById("batch-duration-select").value = String(tpl.duration);
      document.getElementById("batch-ratio-select").value = tpl.ratio;
      // Lock fields filled by template
      document.getElementById("batch-model-select").disabled = true;
      document.getElementById("batch-prompt-input").disabled = true;
      document.getElementById("batch-duration-select").disabled = true;
      document.getElementById("batch-ratio-select").disabled = true;
      // Set template video URL (skip manual upload)
      batchTemplateVideoUrl = tpl.videoUrl;
      batchFiles.video = null; // Clear manual video
      videoPreview.innerHTML = `<span class="file-tag" style="color:var(--accent);">模版视频: ${escapeHtml(tpl.name)}</span>`;
      videoDrop.querySelector(".drop-text").style.display = "none";
      videoDrop.style.pointerEvents = "none";
      videoDrop.style.opacity = "0.6";
    });
  }

  folderInput.addEventListener("change", () => {
    handleBatchImageFiles(folderInput.files);
    folderInput.value = "";
  });

  // Multiple files input
  const filesInput = document.getElementById("batch-images-input-files");
  filesInput.addEventListener("change", () => {
    handleBatchImageFiles(filesInput.files);
    filesInput.value = "";
  });

  // "选择多个图片文件" button
  document.getElementById("batch-pick-files-btn").addEventListener("click", () => {
    document.getElementById("batch-images-input-files").click();
  });

  // Folder drop zone click -> trigger folder input
  const drop = document.getElementById("batch-images-drop");
  drop.addEventListener("click", (e) => {
    if (e.target.closest("button")) return;
    folderInput.click();
  });

  // Drag and drop for images
  drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("drag-over"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("drag-over"));
  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    drop.classList.remove("drag-over");
    handleBatchImageFiles(e.dataTransfer.files);
      document.getElementById("batch-model-select").value = tpl.model;
      document.getElementById("batch-prompt-input").value = tpl.prompt;
      document.getElementById("batch-duration-select").value = String(tpl.duration);
      document.getElementById("batch-ratio-select").value = tpl.ratio;
      // Lock fields filled by template
      document.getElementById("batch-model-select").disabled = true;
      document.getElementById("batch-prompt-input").disabled = true;
      document.getElementById("batch-duration-select").disabled = true;
      document.getElementById("batch-ratio-select").disabled = true;
      // Set template video URL (skip manual upload)
      batchTemplateVideoUrl = tpl.videoUrl;
      batchFiles.video = null; // Clear manual video
      videoPreview.innerHTML = `<span class="file-tag" style="color:var(--accent);">模版视频: ${escapeHtml(tpl.name)}</span>`;
      videoDrop.querySelector(".drop-text").style.display = "none";
      videoDrop.style.pointerEvents = "none";
      videoDrop.style.opacity = "0.6";
    });
  }

  folderInput.addEventListener("change", () => {
    handleBatchImageFiles(folderInput.files);
    folderInput.value = "";
  });

  // Multiple files input
  const filesInput = document.getElementById("batch-images-input-files");
  filesInput.addEventListener("change", () => {
    handleBatchImageFiles(filesInput.files);
    filesInput.value = "";
  });

























  if (!videoPreview) return;
  const videoDrop = videoPreview.closest(".file-drop");

  // Check if it's a preset collection
  if (PRESET_COLLECTIONS[tplKey]) {
    const preset = PRESET_COLLECTIONS[tplKey];
    batchPresetCollection = tplKey;
    batchTemplateVideoUrl = "__preset__";
    batchFiles.video = null;
    document.getElementById("batch-model-select").disabled = true;
    document.getElementById("batch-prompt-input").value = `[预设合集] ${preset.name} - 包含 ${preset.templates.length} 个模版，每张图片将自动生成 ${preset.templates.length} 个任务`;
    document.getElementById("batch-prompt-input").disabled = true;
    document.getElementById("batch-duration-select").disabled = true;
    document.getElementById("batch-ratio-select").disabled = true;
    videoPreview.innerHTML = `<span class="file-tag" style="color:var(--accent);">预设合集: ${escapeHtml(preset.name)}（${preset.templates.length} 个模版）</span>`;
    videoDrop.querySelector(".drop-text").style.display = "none";
    videoDrop.style.pointerEvents = "none";
    videoDrop.style.opacity = "0.6";
    document.getElementById("batch-folder-name").value = preset.name;
    return;
  }

  // Reset preset collection state
  batchPresetCollection = null;

  console.log("Batch files:", batchFiles);
  console.log("Prompt:", prompt);
  console.log("Folder name:", folderName);
  console.log("Preset collection:", batchPresetCollection);

  // Validate
  if (batchFiles.images.length === 0) {
    showBatchStatus("error", "请先上传图片");
    return;
  }
  if (!batchFiles.video && !batchTemplateVideoUrl) {
    showBatchStatus("error", "请上传参考视频或选择模版");
    return;
  }
  // Skip prompt check for preset collections (prompts come from sub-templates)
  if (!batchPresetCollection && !prompt) {
    showBatchStatus("error", "请输入提示词");
    return;
  }
  if (!folderName) {
    showBatchStatus("error", "请输入任务夹名称");
    return;
  }

  btn.disabled = true;

  // ---- Preset Collection Mode ----
  if (batchPresetCollection && PRESET_COLLECTIONS[batchPresetCollection]) {
    await batchGeneratePreset(btn, folderName);
    return;
  videoDrop.style.opacity = "0.6";
}

function setupTemplateShortcuts() {
  const container = document.getElementById("template-shortcuts");
  if (!container) return;

  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".tpl-card, .tpl-shortcut-btn");
    if (!btn || btn.classList.contains("disabled")) return;






















































































































































        batch_created_at: timestamp,
      };

      let retries = 3;
      let created = false;
      
      while (retries > 0 && !created) {
        try {
          console.log(`Creating batch task ${i+1}/${tasksToCreate}... (retries left: ${retries})`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
          
          const resp = await fetch("/api/create-task", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);




  btn.disabled = true;

  // ---- Preset Collection Mode ----
  if (batchPresetCollection && PRESET_COLLECTIONS[batchPresetCollection]) {
    await batchGeneratePreset(btn, folderName);
    return;
  }

  // ---- Normal single-template batch mode (original logic) ----
  console.log("Starting batch generation...");
  const total = batchFiles.images.length;
  const batchId = "batch_" + Math.random().toString(16).slice(2, 10);
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");

  try {
    // 1. Get video URL (template URL or upload)
    let videoUrl;
    if (batchTemplateVideoUrl) {
      videoUrl = batchTemplateVideoUrl;
      updateBatchProgress(5, "使用模版参考视频...");
    } else {
      updateBatchProgress(0, "正在上传参考视频...");
      videoUrl = await uploadToOSS(batchFiles.video.file);
    }

    // 2. Upload all images (continue on individual failure)
    const imageUrls = [];
    let uploadFailCount = 0;
    for (let i = 0; i < total; i++) {







      showBatchStatus("success", `已成功提交 ${successCount} 个批量任务!`);
      if (successCount > 0) parts.push(`${successCount} 个任务创建成功`);
      if (uploadFailCount > 0) parts.push(`${uploadFailCount} 张图片上传失败`);
      showBatchStatus("warning", `提交完成: ${parts.join(", ")}`);
    }

    loadTasks();

  } catch (err) {
    showBatchStatus("error", friendlyError(err.message));
  } finally {
    btn.disabled = false;
    showBatchStatus("error", friendlyError(err.message));
  } finally {
    btn.disabled = false;
  }
}

/**
 * Preset collection batch generation:

    // 3. Create tasks (only for successfully uploaded images)
    const tasksToCreate = imageUrls.length;
    let successCount = 0;
    let failCount = 0;
    for (let i = 0; i < tasksToCreate; i++) {
      const imgInfo = imageUrls[i];
      updateBatchProgress(50 + Math.round(((i) / tasksToCreate) * 50), `正在创建任务 ${i + 1}/${tasksToCreate}...`);

      const body = {
        model: document.getElementById("batch-model-select").value,
        mode: "multimodal",
        prompt: prompt,
        images: [{ url: imgInfo.url, role: "reference_image" }],
        videos: [{ url: videoUrl, role: "reference_video" }],
        audios: [],
        resolution: document.getElementById("batch-resolution-select").value,
        ratio: document.getElementById("batch-ratio-select").value,
        duration: parseInt(document.getElementById("batch-duration-select").value),
        generate_audio: document.getElementById("batch-audio-select").value === "true",
        batch_id: batchId,
        batch_index: imgInfo.index,
        batch_total: total,
        batch_folder_name: folderName,
        batch_created_at: timestamp,
      };

      let retries = 3;
      let created = false;
      
      while (retries > 0 && !created) {
        try {
          console.log(`Creating batch task ${i+1}/${tasksToCreate}... (retries left: ${retries})`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
          
          const resp = await fetch("/api/create-task", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          
          console.log(`Task ${i+1} response:`, resp.status, resp.statusText);
          
          if (resp.ok) {
            successCount++;
            created = true;
          } else if (resp.status === 429) {
            console.warn("Rate limited, waiting 5 seconds...");
            await new Promise(r => setTimeout(r, 5000));
            retries--;
          } else {
            const errorText = await resp.text();
            console.error(`Task ${i+1} failed:`, resp.status, errorText);
            failCount++;
            created = true; // Don't retry on other errors
          }
        } catch (err) {
          console.error(`Task ${i+1} error:`, err.message);
          retries--;
          if (retries > 0) {
            console.log(`Retrying task ${i+1}...`);
            await new Promise(r => setTimeout(r, 2000));
          } else {
            failCount++;
          }
        }







          batch_index: taskIndex,
          batch_total: actualTotal,
          batch_folder_name: folderName,
          batch_created_at: timestamp,
        };

        let retries = 3;
        let created = false;

        while (retries > 0 && !created) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const resp = await fetch("/api/create-task", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
              signal: controller.signal,
            });







































    updateBatchProgress(100, "预设合集任务提交完成");
      showBatchStatus("success", `预设合集「${preset.name}」已成功提交 ${successCount} 个任务! (${imageUrls.length} 张图片 x ${templateKeys.length} 个模版)`);
      if (successCount > 0) parts.push(`${successCount} 个任务创建成功`);
      if (uploadFailCount > 0) parts.push(`${uploadFailCount} 张图片上传失败`);
      showBatchStatus("warning", `提交完成: ${parts.join(", ")}`);
    }

    loadTasks();

  } catch (err) {
    showBatchStatus("error", friendlyError(err.message));
  } finally {

// ========== Batch Summary Rendering ==========
function renderBatchSummaries(tasks) {
  // Group tasks by batch_id
  const batches = {};
  tasks.forEach(t => {
    if (!t.batch_id) return;
    if (!batches[t.batch_id]) batches[t.batch_id] = [];
    batches[t.batch_id].push(t);
  });

  const batchIds = Object.keys(batches);
  }
  for (const [name, dc] of Object.entries(deletedSuccessByUser)) {
    if (!totalCounts[name]) totalCounts[name] = dc;
  }

  // Sort by total count descending
  const sorted = Object.entries(totalCounts).sort((a, b) => b[1] - a[1]);

  const grandTotal = cachedTasks.length + deletedSuccessTotal;
  // Rebuild options, preserving current selection
  const prev = filterSelect.value;
  filterSelect.innerHTML = `<option value="">全部账号 (${grandTotal})</option>` +
    sorted.map(([name, count]) =>
      `<option value="${escapeHtml(name)}">${escapeHtml(name)} (${count})</option>`
    ).join("");
  filterSelect.value = prev;
  // If previous selection no longer exists, reset
  if (filterSelect.value !== prev) {
    adminFilterUser = "";
    filterSelect.value = "";
  }
}

// ---- Admin Panel ----

function setupAdminPanel() {
  const btn = document.getElementById("btn-admin-panel");
  if (!btn) return;
  btn.addEventListener("click", openAdminPanel);
}
  }
}

// ---- Admin Panel ----

function setupAdminPanel() {
  const btn = document.getElementById("btn-admin-panel");
  if (!btn) return;
  btn.addEventListener("click", openAdminPanel);
}

async function openAdminPanel() {
  // Create overlay
  const overlay = document.createElement("div");
  overlay.className = "admin-overlay";
  overlay.innerHTML = `
    <div class="admin-panel">
      <h2>账号管理 <button class="close-btn">&times;</button></h2>
      <div class="admin-create-form">
        <input type="text" id="admin-new-username" placeholder="用户名">
        <input type="password" id="admin-new-password" placeholder="密码(至少6位)">
        <button id="admin-create-btn">创建账号</button>
      </div>
      <div id="admin-msg" style="font-size:13px;margin-bottom:12px;display:none;"></div>
      <table class="admin-user-table">
        <thead><tr><th>用户名</th><th>角色</th><th>状态</th><th>创建时间</th><th>操作</th></tr></thead>
        <tbody id="admin-user-list"></tbody>
      </table>
    </div>
  `;
  document.body.appendChild(overlay);

  // Close
  overlay.querySelector(".close-btn").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

  // Create user
  overlay.querySelector("#admin-create-btn").addEventListener("click", async () => {
    const u = overlay.querySelector("#admin-new-username").value.trim();
    const p = overlay.querySelector("#admin-new-password").value;
    const msg = overlay.querySelector("#admin-msg");
    if (!u || !p) { showAdminMsg(msg, "请填写用户名和密码", true); return; }
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
      await refreshAdminUserList(overlay);
    } catch(e) { showAdminMsg(msg, "网络错误", true); }
  });

  await refreshAdminUserList(overlay);
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

      // Build operations based on role hierarchy
      let ops = "";
      if (u.role === "superadmin") {
        ops = "-";
      } else if (u.role === "admin") {
        // Only superadmin can manage admins
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
        // user role - both admin and superadmin can manage
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

async function adminDeleteUser(userId, username) {
  if (!confirm(`确定要删除账号 "${username}" 吗？该用户的任务将保留。`)) return;
  try {
    const resp = await fetch(`/api/admin/users/${userId}`, {method: "DELETE"});
    const data = await resp.json();
    if (resp.ok) {
      const overlay = document.querySelector(".admin-overlay");
      if (overlay) await refreshAdminUserList(overlay);
    } else { alert(data.error || "删除失败"); }
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username: u, password: p})
      });
      const data = await resp.json();
      if (!resp.ok) { showAdminMsg(msg, data.error || "创建失败", true); return; }
      showAdminMsg(msg, `账号 "${data.username}" 创建成功`, false);
      overlay.querySelector("#admin-new-username").value = "";
      overlay.querySelector("#admin-new-password").value = "";
      await refreshAdminUserList(overlay);
    } catch(e) { showAdminMsg(msg, "网络错误", true); }
  });

  await refreshAdminUserList(overlay);
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
// ========== Asset Management Module ==========
let assetCache = [];
let assetCurrentPage = 1;
let assetFilterStatus = "";
let publicAssetCache = [];
let publicAssetCurrentPage = 1;
let assetSubTab = "mine"; // "mine" | "public"
let assetPollTimers = {};
let assetUploadFile = null;
let selectedAssetId = null;

function setupAssetPage() {
  // Sub-tab switching
  document.querySelectorAll('.asset-sub-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.asset-sub-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      assetSubTab = btn.dataset.assetTab;
      switchAssetTab(assetSubTab);
    });
  });

  // Upload zone
  const zone = document.getElementById('asset-file-drop');
  const fileInput = document.getElementById('asset-file-input');
  if (zone && fileInput) {
    zone.addEventListener('click', (e) => {
      if (e.target.closest('.preview-remove')) return;
      fileInput.click();
    });
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        assetUploadFile = e.dataTransfer.files[0];
        showAssetFilePreview(assetUploadFile);
      }
    });
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        assetUploadFile = fileInput.files[0];
        showAssetFilePreview(assetUploadFile);
      }
    });
  }

  // Submit button
  const submitBtn = document.getElementById('asset-submit-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => submitAssetForReview());
  }

  // Filter buttons
  document.querySelectorAll('.asset-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.asset-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      assetFilterStatus = btn.dataset.status;
      assetCurrentPage = 1;
      assetCache = [];
      clearAssetDetail();
      loadAssets();
    });
  });

  // Load more buttons
  const loadMoreMine = document.getElementById('asset-load-more');
  if (loadMoreMine) loadMoreMine.addEventListener('click', () => loadAssets(true));
  const loadMorePublic = document.getElementById('asset-public-load-more');
  if (loadMorePublic) loadMorePublic.addEventListener('click', () => loadPublicAssets(true));
}

function switchAssetTab(tab) {
  const mineTab = document.getElementById('asset-tab-mine');
  const publicTab = document.getElementById('asset-tab-public');
  clearAssetDetail();
  if (tab === 'mine') {
    if (mineTab) mineTab.style.display = '';
      assetCache = [];
      clearAssetDetail();
      loadAssets();
    });
  }
}

function switchAssetTab(tab) {
  const mineTab = document.getElementById('asset-tab-mine');
  const publicTab = document.getElementById('asset-tab-public');
  clearAssetDetail();
  if (tab === 'mine') {
    if (mineTab) mineTab.style.display = '';
    if (publicTab) publicTab.style.display = 'none';
    if (assetCache.length === 0) loadAssets();
  } else {
    if (mineTab) mineTab.style.display = 'none';
    if (publicTab) publicTab.style.display = '';
    if (publicAssetCache.length === 0) loadPublicAssets();
  }
}

function showAssetFilePreview(file) {
  const preview = document.getElementById('asset-file-preview');
  const dropText = document.getElementById('asset-drop-text');
  if (!preview) return;
  if (dropText) dropText.style.display = 'none';
  if (file.type.startsWith('image/')) {
    const url = URL.createObjectURL(file);
    preview.innerHTML = `<img src="${url}" style="max-height:80px;border-radius:6px;">
      <div style="font-size:11px;color:var(--text-secondary);margin-top:4px;">${escapeHtml(file.name)}</div>`;
  } else if (file.type.startsWith('video/')) {
    preview.innerHTML = `<div style="font-size:28px;">🎬</div>
      <div style="font-size:11px;color:var(--text-secondary);margin-top:4px;">${escapeHtml(file.name)}</div>`;
  } else {
    preview.innerHTML = `<div style="font-size:28px;">🎵</div>
      <div style="font-size:11px;color:var(--text-secondary);margin-top:4px;">${escapeHtml(file.name)}</div>`;
  }
}

function resetAssetUpload() {
  assetUploadFile = null;
  const fileInput = document.getElementById('asset-file-input');
  if (fileInput) fileInput.value = '';
  const preview = document.getElementById('asset-file-preview');
  if (preview) preview.innerHTML = '';
  const dropText = document.getElementById('asset-drop-text');
  if (dropText) dropText.style.display = '';
}

function showAssetStatus(type, message) {
  const el = document.getElementById('asset-upload-status');
  if (!el) return;
  el.style.display = 'block';
  el.className = `status-message ${type}`;
  el.textContent = message;
  if (type === 'success') {
    setTimeout(() => { el.style.display = 'none'; }, 5000);
  }
}

async function submitAssetForReview() {
  if (!assetUploadFile) {
    showAssetStatus("error", "请先选择要上传的文件");
    return;
  }
  const typeSelect = document.getElementById('asset-type-select');
  const resourceType = typeSelect ? typeSelect.value : "Image";
  const submitBtn = document.getElementById('asset-submit-btn');
  if (submitBtn) submitBtn.disabled = true;
  showAssetStatus("info", "正在上传资产文件到OSS...");

  try {
    const ossUrl = await uploadToOSS(assetUploadFile);
    showAssetStatus("info", "正在提交资产审核...");
    const resp = await fetch("/api/asset/create", {
      method: "POST",















    if (submitBtn) submitBtn.disabled = false;
  }
}

async function loadAssets(append = false) {
  const list = document.getElementById('asset-list-mine');
  const emptyHint = document.getElementById('asset-list-empty');
  if (!list) return;
  if (emptyHint) emptyHint.style.display = 'none';
  if (!append) {
    list.innerHTML = '<div class="asset-picker-empty">加载中...</div>';
  }
  try {
    const body = { page_size: 20, page_number: assetCurrentPage };
    if (assetFilterStatus) body.status = assetFilterStatus;
    const resp = await fetch("/api/asset/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    if (!resp.ok) {
      list.innerHTML = `<div class="asset-picker-empty">${escapeHtml(data.error || '加载失败')}</div>`;
      return;
    }
    const result = data.data || {};
    const items = result.Items || [];
    const totalCount = result.TotalCount || 0;
    if (append) {
      assetCache = assetCache.concat(items);
    } else {
      assetCache = items;
    }
    if (assetCache.length === 0) {
      list.innerHTML = '';
      if (emptyHint) emptyHint.style.display = '';
    } else {
      if (emptyHint) emptyHint.style.display = 'none';
      renderAssetList(assetCache, list);
    }
    // Show/hide load more
    const loadMoreBtn = document.getElementById('asset-load-more');
    const hasMore = assetCache.length < totalCount;
    if (loadMoreBtn) loadMoreBtn.style.display = hasMore ? '' : 'none';
    // Poll processing items
    for (const item of items) {
      const st = item.status || item.Status;
      const id = item.id || item.Id;
      if (st === "Processing" && id) {
        pollAssetStatus(id);
      }
    }
  } catch (e) {
    list.innerHTML = `<div class="asset-picker-empty">加载失败: ${escapeHtml(e.message)}</div>`;
  }
}

function renderAssetList(items, container) {
  if (!items.length) {
    container.innerHTML = '<div class="asset-picker-empty">暂无素材</div>';
    return;
  }
  let html = '';
  for (const item of items) {
    const id = item.id || item.Id || '';
    const name = item.id || item.Name || id;
    const st = item.status || item.Status || '';
    const statusMap = { Processing: 'processing', Active: 'active', Failed: 'failed' };
    const statusLabel = { Processing: '审核中', Active: '已通过', Failed: '失败' }[st] || st;
    const statusClass = statusMap[st] || '';
    const thumbHtml = getAssetThumb(item);
    const created = item.created_at ? `<div style="font-size:10px;color:var(--text-secondary);margin-top:2px;">${escapeHtml(item.created_at)}</div>` : '';
    const isSelected = id === selectedAssetId ? ' selected' : '';
    html += `<div class="asset-card${isSelected}" data-asset-id="${escapeHtml(id)}" onclick="renderAssetDetail('${escapeHtml(id)}')">
      <div class="asset-card-thumb">${thumbHtml}</div>
      <div class="asset-card-info">
        <div class="asset-card-name" title="${escapeHtml(id)}">${escapeHtml(name)}</div>
        <span class="asset-card-status status-${statusClass}">${statusLabel}</span>
        ${created}
      </div>
      <div class="asset-card-actions">
        ${st === 'Active' ? `<button onclick="event.stopPropagation(); copyAssetId('${escapeHtml(id)}')">复制ID</button>` : ''}
        ${st === 'Processing' ? `<button onclick="event.stopPropagation(); refreshAssetStatus('${escapeHtml(id)}')">刷新状态</button>` : ''}
      </div>
    </div>`;
  }
  container.innerHTML = html;
}

function getAssetThumb(item) {
  const preview = item.url || item.PreviewUrl || item.URL || '';
  const assetType = (item.type || item.AssetType || '').toLowerCase();
  if (preview && assetType === 'image') {
    return `<img src="${escapeHtml(preview)}" alt="" onerror="this.outerHTML='<span class=\\'asset-type-icon\\'>🖼️</span>'">`;
  }
  if (preview && assetType === 'video') {
    return `<video src="${escapeHtml(preview)}" muted playsinline preload="auto" onerror="this.outerHTML='<span class=\\'asset-type-icon\\'>🎬</span>'"></video>`;
  }
  const iconMap = { image: '🖼️', video: '🎬', audio: '🎵' };
  return `<span class="asset-type-icon">${iconMap[assetType] || '📁'}</span>`;
}

function copyAssetId(assetId) {
  navigator.clipboard.writeText(assetId).then(() => {
    showAssetStatus("success", "资产ID已复制");
  }).catch(() => {
    showAssetStatus("error", "复制失败");
  });
}

function pollAssetStatus(assetId) {
  if (assetPollTimers[assetId]) return;
  assetPollTimers[assetId] = setInterval(async () => {
    try {
      const resp = await fetch("/api/asset/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_id: assetId }),
      });
      const data = await resp.json();
  const preview = item.url || item.PreviewUrl || item.URL || '';
  const assetType = (item.type || item.AssetType || '').toLowerCase();
  if (preview && assetType === 'image') {
    return `<img src="${escapeHtml(preview)}" alt="" onerror="this.outerHTML='<span class=\\'asset-type-icon\\'>🖼️</span>'">`;
  }
  if (preview && assetType === 'video') {
    return `<video src="${escapeHtml(preview)}" muted playsinline preload="auto" onerror="this.outerHTML='<span class=\\'asset-type-icon\\'>🎬</span>'"></video>`;
  }
  if (submitBtn) {
    submitBtn.addEventListener('click', () => submitAssetForReview());

























      assetFilterOwner = ownerFilter.value;
      assetCurrentPage = 1;
      assetCache = [];
      clearAssetDetail();
      loadAssets();
    });
  }
}

function switchAssetTab(tab) {
  const mineTab = document.getElementById('asset-tab-mine');
  const publicTab = document.getElementById('asset-tab-public');
  clearAssetDetail();
  if (tab === 'mine') {
    if (mineTab) mineTab.style.display = '';
        showAssetStatus("success", `资产 ${assetId} 已审核通过`);
      } else if (newStatus === 'Failed') {
        showAssetStatus("error", `资产 ${assetId} 审核失败`);
      } else {
        showAssetStatus("info", `资产 ${assetId} 当前状态: ${newStatus}`);
      }
    } else {
      showAssetStatus("error", data.error || "查询状态失败");
    }
  } catch (e) {
    showAssetStatus("error", "查询状态失败: " + e.message);
  }
}

function setAssetFilter(status) {
  assetFilterStatus = status;
  assetCurrentPage = 1;
  assetCache = [];
  loadAssets();
}

async function loadPublicAssets(append = false) {
  const list = document.getElementById('asset-list-public');
  if (!list) return;
  if (!append) {
    list.innerHTML = '<div class="asset-picker-empty">加载中...</div>';
  }
  try {
    const body = { page_size: 20 };
    if (publicAssetCurrentPage > 1) body.PageNum = publicAssetCurrentPage;
    const resp = await fetch("/api/asset/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    if (!resp.ok) {
      list.innerHTML = `<div class="asset-picker-empty">${escapeHtml(data.error || '加载失败')}</div>`;
      return;
    }
    const result = data.data || {};
    const items = result.Items || [];
    const total = result.Total || 0;
    if (append) {
      publicAssetCache = publicAssetCache.concat(items);
    } else {
      publicAssetCache = items;
    }
    renderAssetList(publicAssetCache, list);
    const loadMoreBtn = document.getElementById('asset-public-load-more');
    const hasMore = publicAssetCache.length < total;
    if (loadMoreBtn) loadMoreBtn.style.display = hasMore ? '' : 'none';
  } catch (e) {
    list.innerHTML = `<div class="asset-picker-empty">加载失败: ${escapeHtml(e.message)}</div>`;
  }
}

function renderAssetDetail(assetId) {
  const item = assetCache.find(a => (a.id || a.Id || a.AssetId) === assetId) || publicAssetCache.find(a => (a.id || a.Id || a.AssetId) === assetId);
  const content = document.getElementById('asset-detail-inline');
  const emptyHint = document.getElementById('asset-detail-empty');
  if (!content || !item) return;

  // Update selected state
  selectedAssetId = assetId;
  document.querySelectorAll('.asset-card.selected').forEach(c => c.classList.remove('selected'));
  const card = document.querySelector(`.asset-card[data-asset-id="${CSS.escape(assetId)}"]`);
  if (card) card.classList.add('selected');

  if (emptyHint) emptyHint.style.display = 'none';
  const id = item.id || item.Id || item.AssetId || '';
  const assetType = (item.type || item.AssetType || item.ResourceType || '-').toLowerCase();
  const st = item.status || item.Status || '-';
  const created = item.created_at || '';
  const url = item.url || item.PreviewUrl || item.URL || '';

  // Build preview (sized for 380px left panel)
  let previewHtml = '';
  if (url && assetType === 'image') {
    previewHtml = `<div style="margin-bottom:12px;border-radius:8px;overflow:hidden;background:var(--bg-secondary);">
      <img src="${escapeHtml(url)}" style="width:100%;max-height:240px;object-fit:contain;display:block;" alt="素材预览">
    </div>`;
  } else if (url && assetType === 'video') {
    previewHtml = `<div style="margin-bottom:12px;border-radius:8px;overflow:hidden;background:#000;">
      <video src="${escapeHtml(url)}" controls playsinline preload="auto" style="width:100%;max-height:240px;display:block;"
        onerror="this.outerHTML='<div style=\\'text-align:center;padding:24px;color:#aaa;\\'>🎬<div style=\\'margin-top:8px;font-size:12px;\\'>视频预览不可用</div></div>'"></video>
    </div>`;
  } else if (url && assetType === 'audio') {
    previewHtml = `<div style="margin-bottom:12px;">
      <audio src="${escapeHtml(url)}" controls style="width:100%;"></audio>
    </div>`;
  } else if (url) {
    previewHtml = `<div style="margin-bottom:12px;text-align:center;padding:24px;background:var(--bg-secondary);border-radius:8px;">
      <span style="font-size:48px;">📁</span>
      <div style="margin-top:8px;font-size:12px;color:var(--text-secondary);">无法预览此类型文件</div>
    </div>`;
  }

  const statusMap = { Processing: '审核中', Active: '已通过', Failed: '失败' };
  const statusLabel = statusMap[st] || st;

  content.innerHTML = `
    ${previewHtml}
    <div class="asset-detail-item"><span class="label">资产ID</span><span class="value" style="word-break:break-all;">${escapeHtml(id)}</span></div>
    <div class="asset-detail-item"><span class="label">类型</span><span class="value">${escapeHtml(assetType)}</span></div>
    <div class="asset-detail-item"><span class="label">状态</span><span class="value">${escapeHtml(statusLabel)}</span></div>
    ${created ? `<div class="asset-detail-item"><span class="label">创建时间</span><span class="value">${escapeHtml(created)}</span></div>` : ''}
    <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
      ${st === 'Active' ? `<button class="btn-asset-pick" onclick="copyAssetId('${escapeHtml(id)}')">复制资产ID</button>` : ''}
      ${st === 'Processing' ? `<button class="btn-asset-pick" onclick="refreshAssetStatus('${escapeHtml(id)}')">刷新状态</button>` : ''}
    </div>
  `;
}

function clearAssetDetail() {
  selectedAssetId = null;
  const content = document.getElementById('asset-detail-inline');
  const emptyHint = document.getElementById('asset-detail-empty');
  if (content) content.innerHTML = '';
  if (emptyHint) emptyHint.style.display = '';
  if (emptyHint) emptyHint.style.display = '';
  document.querySelectorAll('.asset-card.selected').forEach(c => c.classList.remove('selected'));
}

// ========== Asset Picker Module ==========
let assetPickerCallback = null;
let assetPickerMulti = false;
let assetPickerSelected = [];
let assetPickerType = "image";
let pickerAssetItems = [];
function getAssetPreviewUrl(assetId) {
  const sources = [pickerAssetItems, assetCache, publicAssetCache];
  for (const list of sources) {
    const item = list.find(a => (a.id || a.Id || a.AssetId) === assetId);
    if (item) {
      const url = item.url || item.PreviewUrl || item.URL || '';
      if (url) return url;
    }
  }
  return '';
}

async function openAssetPicker(type, target, multi) {
  assetPickerType = type || "image";
  assetPickerCallback = target;
  assetPickerMulti = !!multi;
  assetPickerSelected = [];

  const overlay = document.getElementById('asset-picker-overlay');
  if (!overlay) {
    // Create overlay dynamically if not in HTML
    const div = document.createElement('div');
    div.id = 'asset-picker-overlay';
    div.className = 'asset-picker-overlay';
    div.innerHTML = `
      <div class="asset-picker-modal">
        <div class="asset-picker-header">
          <h3>选择资产</h3>
          <button class="asset-picker-close" onclick="closeAssetPicker()">&times;</button>
        </div>
        <div class="asset-picker-body">
          <div class="asset-picker-grid" id="asset-picker-grid"></div>
          <div class="asset-picker-empty" id="asset-picker-empty" style="display:none">暂无可用资产</div>
        </div>
        <div class="asset-picker-footer">
          <button class="btn-cancel" onclick="closeAssetPicker()">取消</button>
          <button class="btn-confirm" id="btn-picker-confirm" onclick="onAssetPickerConfirm()" disabled>确认选择</button>
        </div>
      </div>`;
    document.body.appendChild(div);
  }

  const pickerOverlay = document.getElementById('asset-picker-overlay');
  pickerOverlay.classList.add('active');

  // Load active assets for selection
  const grid = document.getElementById('asset-picker-grid');
  const empty = document.getElementById('asset-picker-empty');
  grid.innerHTML = '<div class="asset-picker-empty">加载中...</div>';
  if (empty) empty.style.display = 'none';

  try {
    const resp = await fetch("/api/asset/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page_size: 50, status: "Active" }),
    });
    const data = await resp.json();
    const result = data.data || {};
    const items = result.Items || [];
    // Filter by type if needed
    const filtered = items.filter(it => {
      const t = (it.type || it.AssetType || it.ResourceType || '').toLowerCase();
      if (assetPickerType === 'image') return t === 'image';
      if (assetPickerType === 'video') return t === 'video';
      if (assetPickerType === 'audio') return t === 'audio';
      return true;
    });
    pickerAssetItems = filtered;
    if (!filtered.length) {
      grid.innerHTML = '';
      if (empty) { empty.style.display = ''; empty.textContent = '暂无可用的' + ({image:'图片',video:'视频',audio:'音频'}[assetPickerType]||'') + '资产'; }
      return;
    }
    let html = '';
    for (const item of filtered) {
      const id = item.id || item.Id || item.AssetId || '';
      const name = item.id || item.Name || id;
      const thumbHtml = getAssetThumb(item);
      html += `<div class="asset-picker-card" data-asset-id="${escapeHtml(id)}" onclick="togglePickerCard(this)">
        <div class="picker-thumb">${thumbHtml}</div>
        <div class="picker-name" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
      </div>`;
    }
    grid.innerHTML = html;
  } catch (e) {
    grid.innerHTML = `<div class="asset-picker-empty">加载失败: ${escapeHtml(e.message)}</div>`;
  }
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
  if (!assetPickerSelected.length) return;
  const target = assetPickerCallback;

  for (const assetId of assetPickerSelected) {
    const assetUrl = `asset://${assetId}`;
    const previewUrl = getAssetPreviewUrl(assetId);
    if (target === 'firstFrame') {
      uploadedFiles.firstFrame = { file: null, url: assetUrl, previewUrl: previewUrl, name: '资产形象' };
      const preview = document.getElementById("first-frame-preview");
      if (preview) {
        const dropText = preview.closest(".file-drop").querySelector(".drop-text");
    const items = result.Items || [];


      const t = (it.type || it.AssetType || it.ResourceType || '').toLowerCase();
      if (assetPickerType === 'image') return t === 'image';
      if (assetPickerType === 'video') return t === 'video';
      if (assetPickerType === 'audio') return t === 'audio';
      return true;








    for (const item of filtered) {
      const id = item.id || item.Id || item.AssetId || '';
      const name = item.id || item.Name || id;
      const thumbHtml = getAssetThumb(item);
      html += `<div class="asset-picker-card" data-asset-id="${escapeHtml(id)}" onclick="togglePickerCard(this)">
        <div class="picker-thumb">${thumbHtml}</div>
        <div class="picker-name" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
      </div>`;
    }
    grid.innerHTML = html;















































































































































































































































    renderBatchImageGrid();
  }

  closeAssetPicker();
  showStatus("success", `已选择 ${assetPickerSelected.length} 个资产`);
}

function closeAssetPicker() {
  const overlay = document.getElementById('asset-picker-overlay');
  if (overlay) overlay.classList.remove('active');
  assetPickerSelected = [];
  assetPickerCallback = null;
}


































function renderStatsOverview(container, data) {
  // Summary cards
  let html = '<div class="stats-cards">';
  html += statsCard("总视频数", data.total_tasks, "");
  html += statsCard("成功", data.succeeded_tasks, "success");
  html += statsCard("失败", data.failed_tasks, "danger");
  html += statsCard("成功率", data.success_rate + "%", "accent");
  html += statsCard("总 Tokens", formatTokens(data.total_tokens), "");
  html += statsCard("总费用", "\u00A5" + formatCost(data.total_cost_yuan), "warning");
  html += '</div>';

  // By model table
  html += '<h4 class="stats-section-title">按模型统计</h4>';
  html += '<table class="stats-table"><thead><tr>';
  html += '<th>模型</th><th>视频数</th><th>成功数</th><th>Tokens</th><th>费用</th>';
  html += '</tr></thead><tbody>';
  for (const [model, info] of Object.entries(data.by_model || {})) {
    const label = model === "seedance-2.0" ? "Seedance 2.0 (标准)" : model === "seedance-2.0-fast" ? "Seedance 2.0 Fast (快速)" : model;
    html += '<tr>';
    html += '<td>' + label + '</td>';
    html += '<td>' + info.count + '</td>';
    html += '<td>' + info.succeeded + '</td>';
    html += '<td>' + formatTokens(info.tokens) + '</td>';
    html += '<td>\u00A5' + formatCost(info.cost) + '</td>';
    html += '</tr>';
  }
  html += '</tbody></table>';

  // By user table
  html += '<h4 class="stats-section-title">按用户统计</h4>';
  html += '<table class="stats-table"><thead><tr>';
  html += '<th>用户</th><th>视频数</th><th>成功数</th><th>Tokens</th><th>费用</th>';
  html += '</tr></thead><tbody>';
  for (const u of (data.by_user || [])) {
    html += '<tr>';
    html += '<td>' + u.username + '</td>';
    html += '<td>' + u.count + '</td>';
    html += '<td>' + u.succeeded + '</td>';
    html += '<td>' + formatTokens(u.tokens) + '</td>';
    html += '<td>\u00A5' + formatCost(u.cost) + '</td>';
    html += '</tr>';
  }
  html += '</tbody></table>';

  html += '<p class="stats-note">* 费用数据仅统计有 token 记录的任务，历史任务可能为 0</p>';

  container.innerHTML = html;
}

function statsCard(label, value, colorClass) {
  const cls = colorClass ? ' stats-card-' + colorClass : '';
  return '<div class="stats-card' + cls + '">'
    + '<div class="stats-value">' + value + '</div>'
    + '<div class="stats-label">' + label + '</div>'
    + '</div>';
}


















































async function loadAdminStatsOverview(overlay) {
  const container = overlay.querySelector("#admin-stats-overview");
  if (!container) return;
  container.innerHTML = '<div class="stats-loading">加载中...</div>';
  try {
    const resp = await fetch("/api/stats/overview");
    if (!resp.ok) {
      container.innerHTML = '<div class="stats-loading">加载失败: ' + resp.status + '</div>';
      return;
    }
    const data = await resp.json();
    renderStatsOverview(container, data);
  } catch (e) {
    container.innerHTML = '<div class="stats-loading">网络错误</div>';
  }
}

function renderStatsOverview(container, data) {
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

  html += '<p class="stats-note">* 仅统计有 token 记录的任务（从 2026-04-28 起开始记录）</p>';

  container.innerHTML = html;
}

function statsCard(label, value, colorClass) {
  const cls = colorClass ? ' stats-card-' + colorClass : '';
  return '<div class="stats-card' + cls + '">'
    + '<div class="stats-value">' + value + '</div>'
    + '<div class="stats-label">' + label + '</div>'
    + '</div>';
}

      html += '<td>' + escapeHtml(u.username) + '</td>';
      html += '<td>' + u.count + '</td>';
      html += '<td>' + formatTokens(u.tokens) + '</td>';
      html += '<td>\u00A5' + formatCost(u.cost) + '</td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
  }

  // By duration table (per model)
  html += '<h4 class="stats-section-title">按生成秒数统计</h4>';
  html += '<table class="stats-table"><thead><tr>';
  html += '<th>模型</th><th>秒数</th><th>视频数</th><th>Tokens</th><th>费用</th>';
      html += '<td>' + u.count + '</td>';
      html += '<td>' + pct + '%</td>';
      html += '</tr>';
    }
    if (users.length === 0) {
      html += '<tr><td colspan="3" style="text-align:center;color:var(--text-secondary)">暂无数据</td></tr>';
    }
    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = '<div class="stats-loading">网络错误</div>';
  }
}

async function loadAdminStatsOverview(overlay) {
  const container = overlay.querySelector("#admin-stats-overview");
  if (!container) return;
  container.innerHTML = '<div class="stats-loading">加载中...</div>';
  try {
    const resp = await fetch("/api/stats/overview");
    if (!resp.ok) {
      container.innerHTML = '<div class="stats-loading">加载失败: ' + resp.status + '</div>';
      return;
    }
    const data = await resp.json();
    renderStatsOverview(container, data);
  } catch (e) {
    container.innerHTML = '<div class="stats-loading">网络错误</div>';
  }
}

function renderStatsOverview(container, data) {
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

  // By user with cost (tracked tasks only)
  if (data.by_user && data.by_user.length > 0) {
    html += '<h4 class="stats-section-title">按账号费用明细</h4>';
    html += '<table class="stats-table"><thead><tr>';
    html += '<th>账号</th><th>已统计视频数</th><th>Tokens</th><th>费用</th>';
    html += '</tr></thead><tbody>';
