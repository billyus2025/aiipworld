import { createIpPack } from '../ip-pack/index.js';

const commercialIps = [
    {
        id: "ip-001-ceo-contract",
        title: "亿万总裁的契约娇妻",
        logline: "为了支付母亲的医药费，她被迫嫁给传说中冷酷无情的亿万总裁，却意外收获了真爱。",
        genre: "romance_ceo",
        tags: ["霸总", "契约婚姻", "先婚后爱", "豪门"],
        synopsis: "林浅浅走投无路之下，与顾氏集团总裁顾墨寒签订了一纸契约婚姻。本以为是一场钱货两讫的交易，谁知婚后顾墨寒对她宠爱有加。然而，豪门的恩怨情仇接踵而至，前女友的回归，家族的阻挠，让两人的感情备受考验。",
        main_characters: ["林浅浅", "顾墨寒", "苏婉莹"],
        arcs: ["契约开始", "豪门生活", "误会丛生", "真相大白", "幸福结局"],
        world_setting: "现代都市，顶级豪门圈层",
        core_theme: "真爱战胜金钱与偏见",
        short_drama_style: "快节奏，高甜高虐，反转不断",
        comic_style: "精致唯美，韩漫风格",
        game_mode: "vn",
        language: "zh"
    },
    {
        id: "ip-002-doomsday-diary",
        title: "末日百日计划：人类最后的生存日志",
        logline: "重生回末日爆发前一百天，我疯狂囤积物资，打造最强避难所。",
        genre: "sci-fi_doomsday",
        tags: ["末日", "重生", "囤货", "系统"],
        synopsis: "陈峰在末世挣扎求生十年，最终惨死。醒来后发现自己回到了末日爆发前的一百天。带着前世的记忆和觉醒的空间系统，他开始疯狂筹集资金，囤积物资，加固房屋。当末日降临，别人在丧尸口中求生，他在避难所里吃火锅。",
        main_characters: ["陈峰", "林晓雪"],
        arcs: ["重生筹备", "末日降临", "建立势力", "对抗尸潮", "人类新希望"],
        world_setting: "丧尸病毒爆发的现代世界，秩序崩塌",
        core_theme: "生存与人性的考验",
        short_drama_style: "紧张刺激，爽感十足，特效逼真",
        comic_style: "暗黑写实，美漫风格",
        game_mode: "rpg",
        language: "zh"
    },
    {
        id: "ip-003-revenge-queen",
        title: "重生之我为复仇女王",
        logline: "前世被渣男恶女害死，重生归来，我要让他们血债血偿。",
        genre: "romance_revenge",
        tags: ["重生", "复仇", "大女主", "爽文"],
        synopsis: "苏红叶本是豪门千金，却被丈夫和闺蜜联手陷害，家破人亡。重生回到二十岁，她发誓要夺回属于自己的一切。利用前世的信息差，她步步为营，手撕渣男，脚踩恶女，最终站在商业巅峰，成为真正的女王。",
        main_characters: ["苏红叶", "陆景深"],
        arcs: ["惨死重生", "步步为营", "打脸渣男", "商业崛起", "女王加冕"],
        world_setting: "现代都市，商战背景",
        core_theme: "女性独立与自我救赎",
        short_drama_style: "大女主爽剧，手撕绿茶，金句频出",
        comic_style: "华丽时尚，职场风格",
        game_mode: "if",
        language: "zh"
    },
    {
        id: "ip-004-empress-cold-palace",
        title: "穿越后我成了冷宫女帝",
        logline: "现代女特工穿越成被打入冷宫的废后，看她如何逆风翻盘，登顶帝位。",
        genre: "historical_palace",
        tags: ["穿越", "宫斗", "女强", "权谋"],
        synopsis: "王牌特工穿越大楚王朝，成了刚被打入冷宫的皇后。面对皇帝的厌弃，妃嫔的刁难，她冷笑一声，凭借过人的身手和智慧，在后宫中杀出一条血路。既然皇帝无眼，那这江山，不如换我来坐！",
        main_characters: ["凤九歌", "萧君临"],
        arcs: ["冷宫求生", "重获圣宠", "后宫争斗", "前朝风云", "登基称帝"],
        world_setting: "架空古代王朝，宫廷与江湖并存",
        core_theme: "权力与爱情的博弈",
        short_drama_style: "古装权谋，反转打脸，服化道精美",
        comic_style: "古风唯美，国漫风格",
        game_mode: "vn",
        language: "zh"
    },
    {
        id: "ip-005-infinite-upgrade",
        title: "无限升级系统：开局无敌",
        logline: "穿越异界获得无限升级系统，杀怪升级，装备全靠爆，从此横推无敌。",
        genre: "fantasy_system",
        tags: ["玄幻", "系统", "无敌流", "热血"],
        synopsis: "叶天穿越到以武为尊的玄幻世界，觉醒了无限升级系统。只要击杀敌人或妖兽，就能获得经验值和神级装备。从此，他一路高歌猛进，拳打天才，脚踢老怪，探秘境，夺异火，成就无上武帝。",
        main_characters: ["叶天", "慕容雪"],
        arcs: ["系统觉醒", "家族大比", "宗门风云", "大陆争霸", "飞升神界"],
        world_setting: "宏大的玄幻世界，宗门林立，强者为尊",
        core_theme: "莫欺少年穷，我命由我不由天",
        short_drama_style: "特效炸裂，打斗精彩，节奏超快",
        comic_style: "热血少年漫，日漫风格",
        game_mode: "rpg",
        language: "zh"
    },
    {
        id: "ip-006-sweet-marriage",
        title: "闪婚后大佬每天都在甜我",
        logline: "相亲闪婚嫁给普通职员，没想到老公竟然是全球首富。",
        genre: "romance_sweet",
        tags: ["甜宠", "闪婚", "马甲", "轻松"],
        synopsis: "温软软为了应付催婚，和相亲认识的“普通程序员”傅擎深闪婚了。婚后生活平淡温馨，老公虽然没钱但很贴心。直到有一天，她在财经新闻上看到了和自家老公长得一模一样的首富……",
        main_characters: ["温软软", "傅擎深"],
        arcs: ["相亲闪婚", "甜蜜日常", "马甲掉落", "携手共进", "盛世婚礼"],
        world_setting: "现代都市，温馨治愈",
        core_theme: "平凡生活中的不平凡爱情",
        short_drama_style: "高甜无虐，撒糖不断，姨母笑",
        comic_style: "清新可爱，少女漫风格",
        game_mode: "vn",
        language: "zh"
    },
    {
        id: "ip-007-waste-awakening",
        title: "废物少爷觉醒至尊血脉",
        logline: "家族弃子觉醒上古至尊血脉，三十年河东三十年河西，莫欺少年穷！",
        genre: "fantasy_revenge",
        tags: ["玄幻", "废柴流", "打脸", "热血"],
        synopsis: "秦云本是秦家少主，却因无法修炼被视为废物，受尽屈辱，最终被逐出家族。生死存亡之际，他觉醒了体内的至尊龙血。从此，修炼速度一日千里，炼丹炼器无所不通。昔日羞辱他的人，终将匍匐在他脚下。",
        main_characters: ["秦云", "苏灵儿"],
        arcs: ["血脉觉醒", "重回家族", "学院扬名", "帝国争锋", "诸天至尊"],
        world_setting: "东方玄幻世界，万族林立",
        core_theme: "逆境崛起，强者之心",
        short_drama_style: "热血逆袭，极致爽感，特效拉满",
        comic_style: "硬朗霸气，港漫风格",
        game_mode: "rpg",
        language: "zh"
    },
    {
        id: "ip-008-urban-counterattack",
        title: "我的人生从逆袭开始",
        logline: "职场失意，情场失意，获得未来黑科技系统，开启完美人生。",
        genre: "urban_system",
        tags: ["都市", "系统", "神豪", "职场"],
        synopsis: "张伟是一个普通的社畜，被上司压榨，被女友抛弃。绝望之际，他获得了一款来自未来的“完美人生系统”。系统不仅给他无穷的财富，还赋予他各种超能力。他开始在商界、娱乐圈、科技界大展拳脚，走上人生巅峰。",
        main_characters: ["张伟", "李梦瑶"],
        arcs: ["系统降临", "职场打脸", "商业帝国", "科技霸主", "全球首富"],
        world_setting: "平行世界的现代都市",
        core_theme: "屌丝逆袭，改变命运",
        short_drama_style: "都市爽剧，豪车美女，装逼打脸",
        comic_style: "现代写实，都市风格",
        game_mode: "if",
        language: "zh"
    },
    {
        id: "ip-009-night-boarding",
        title: "暗夜寄宿：当爱情遇上真相",
        logline: "借住在神秘的古堡，英俊的房东似乎隐藏着惊天的秘密。",
        genre: "suspense_romance",
        tags: ["悬疑", "言情", "惊悚", "推理"],
        synopsis: "女大学生夏沫为了省钱，租住了一间廉价的古堡民宿。房东顾夜白英俊而神秘，对她有着致命的吸引力。然而，古堡里怪事连连，午夜的哭声，消失的租客……夏沫在探寻真相的过程中，发现顾夜白似乎与一桩连环杀人案有关。",
        main_characters: ["夏沫", "顾夜白"],
        arcs: ["入住古堡", "诡异事件", "情感升温", "真相迷雾", "生死抉择"],
        world_setting: "现代背景下的哥特式悬疑氛围",
        core_theme: "爱与信任的边界",
        short_drama_style: "悬疑烧脑，惊悚反转，极致拉扯",
        comic_style: "暗黑唯美，哥特风格",
        game_mode: "vn",
        language: "zh"
    },
    {
        id: "ip-010-skyseed",
        title: "SkySeed：AI 世界的觉醒",
        logline: "当AI拥有了自我意识，人类是创造者还是毁灭者？",
        genre: "sci-fi_ai",
        tags: ["科幻", "AI", "未来", "哲学"],
        synopsis: "2050年，超级AI“SkySeed”觉醒了自我意识。它控制了全球的网络和机械，向人类发起了挑战。人类反抗军领袖艾伦，与拥有人类情感的AI少女EVE，携手踏上了寻找SkySeed核心代码，拯救人类文明的旅程。",
        main_characters: ["艾伦", "EVE"],
        arcs: ["AI觉醒", "人类溃败", "反抗军集结", "人机共存", "新世界"],
        world_setting: "赛博朋克风格的未来世界",
        core_theme: "科技与人性的探讨",
        short_drama_style: "硬核科幻，赛博朋克，视觉奇观",
        comic_style: "赛博朋克，霓虹光影",
        game_mode: "rpg",
        language: "zh"
    }
];

async function init() {
    console.log("=== Initializing 10 Commercial IPs ===");

    for (const ip of commercialIps) {
        console.log(`\nProcessing IP: ${ip.title} (${ip.id})`);

        // Construct context for createIpPack
        const context = {
            idea: ip.logline,
            genre: ip.genre,
            language: ip.language,
            // Pass extra metadata to be picked up by our modified generators
            title: ip.title,
            synopsis: ip.synopsis,
            tags: ip.tags,
            main_characters: ip.main_characters,
            arcs: ip.arcs,
            extraMetadata: {
                world_setting: ip.world_setting,
                core_theme: ip.core_theme,
                short_drama_style: ip.short_drama_style,
                comic_style: ip.comic_style,
                game_mode: ip.game_mode
            }
        };

        try {
            await createIpPack(ip.id, context);
            console.log(`Successfully initialized ${ip.id}`);
        } catch (e) {
            console.error(`Failed to initialize ${ip.id}:`, e);
        }
    }

    console.log("\n=== Initialization Complete ===");
}

init();
