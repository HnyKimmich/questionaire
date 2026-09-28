(function exposeQuestionnaire(root, factory) {
  const questionnaire = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = questionnaire;
  if (root) root.PEERLY_QUESTIONNAIRE = questionnaire;
})(typeof window !== 'undefined' ? window : null, function buildQuestionnaire() {
  return {
    version: '2026-09-29.2',
    title: '在见面之前，先认识一下你',
    chapters: [
      {
        id: 'beliefs',
        number: '01',
        title: '来点迷信与刻板印象',
        eyebrow: 'FIRST IMPRESSION',
        description: '轻松一点，从几个常见标签开始。',
        questions: [
          {
            id: 'zodiac',
            group: '星座卡片',
            prompt: '你的星座是什么？',
            type: 'single',
            options: ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'],
          },
          {
            id: 'zodiac_belief',
            group: '星座卡片',
            prompt: '你相信星座吗？',
            type: 'single',
            options: ['信', '不信'],
          },
          {
            id: 'mbti',
            group: 'MBTI 卡片',
            prompt: '你的MBTI是什么？',
            type: 'single',
            options: ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'],
          },
          {
            id: 'mbti_belief',
            group: 'MBTI 卡片',
            prompt: '你相信MBTI吗？',
            type: 'single',
            options: ['信', '不信'],
          }
        ]
      },
      {
        id: 'high_school',
        number: '02',
        title: '何以高中',
        eyebrow: 'BEFORE COLLEGE',
        description: '看看高中留下了什么，也看看你带来了什么。',
        questions: [
          {
            id: 'delayed_interests',
            prompt: '在你的高中时期，因为学习而被“耽误”的事业是什么？',
            type: 'multi',
            options: [
              '坚持阅读写作', '追番/剧/电影', '电竞',
              { value: '培养音乐方面的技能', label: '培养音乐方面的技能', detail: true },
              '绘画/摄影/编导',
              { value: '某项体育运动', label: '某项体育运动', detail: true },
              '去很多地方旅行', '谈恋爱被干预？'
            ]
          },
          {
            id: 'best_subject',
            group: '学科卡片',
            prompt: '你高中最拿手的科目是什么？',
            type: 'single',
            options: ['语文', '数学', '英语', '政治', '历史', '地理', '物理', '化学', '生物'],
          },
          {
            id: 'favorite_subject',
            group: '学科卡片',
            prompt: '你高中最喜欢的科目是什么？',
            type: 'single',
            options: ['语文', '数学', '英语', '政治', '历史', '地理', '物理', '化学', '生物'],
          },
          {
            id: 'same_major',
            prompt: '在高中幻想大学的时候，想读的专业是现在的这个吗？',
            type: 'single',
            options: ['是', '不是'],
          },
          {
            id: 'original_major',
            prompt: '是哪个？',
            type: 'text',
            placeholder: '写下当时想读的专业',
            condition: { question: 'same_major', equals: '不是' }
          }
        ]
      },
      {
        id: 'college',
        number: '03',
        title: '当我们谈到大学',
        eyebrow: 'CAMPUS LIFE',
        description: '大学没有标准答案，先看看你最在意什么。',
        questions: [
          {
            id: 'college_goals',
            prompt: '你对大学生活的目标排序是？',
            type: 'rank',
            options: [
              '卷绩点->保研', '刷实习->就业',
              { value: '培养某一门爱好', label: '培养某一门爱好', detail: true },
              '找npy', '入党', '结识好友，形成自己的圈子',
              '参加科研/竞赛->学术积累', '交换/留学->看看世界', '坚持运动->保持健康'
            ],
          },
          {
            id: 'first_meeting_topics',
            prompt: '你希望我在第一次见面会上介绍哪些内容？',
            type: 'rank',
            options: ['学习指导', '生涯规划', '觅食指南', 'agent使用', { value: '自定义内容', label: '其他', custom: true }]
          }
        ]
      },
      {
        id: 'ai',
        number: '04',
        title: '关于大模型',
        eyebrow: 'AI & YOU',
        description: '不考技术，只想了解你现在怎样和 AI 相处。',
        questions: [
          {
            id: 'main_model',
            prompt: '你现在最经常用的大模型是什么?',
            type: 'single',
            options: ['kimi', '豆包', '千问', 'deepseek', 'chatgpt', 'gemini', 'Claude', '腾讯元宝', '文心一言', '智谱清言', 'Grok', { value: '其他', label: '其他', detail: true }],
          },
          {
            id: 'agent_contact',
            prompt: '你接触过agent吗',
            type: 'single',
            options: ['接触过', '没接触过']
          },
          {
            id: 'agent_products',
            prompt: '你使用过哪些agent？',
            type: 'multi',
            options: ['Codex', 'Claude Code', 'TRAE', 'Qoder CN（原通义灵码）', 'CodeBuddy', '文心快码（Baidu Comate）', 'WorkBuddy', { value: '其他', label: '其他', detail: true }],
            condition: { question: 'agent_contact', equals: '接触过' }
          },
          {
            id: 'ai_uses',
            prompt: '你通常会用AI做什么？',
            type: 'multi',
            options: ['查资料/解释概念', '辅助学习', '写作/润色', '翻译', '编程', '总结文档', '制作PPT', '生成图片/视频', '生活建议', '情绪陪伴', '纯娱乐', { value: '其他', label: '其他', detail: true }]
          }
        ]
      }
    ]
  };
});
