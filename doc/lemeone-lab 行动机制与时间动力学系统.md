# **lemeone-lab：行动机制与时间动力学系统设计 (Action & Time Dynamics)**

本系统旨在模拟真实创业中的“决策-反馈”周期，结合专业 CLI 指令的严肃性与弹性时间流速的沉浸感。

## **1\. 核心行动系统：意图-插件模型 (Intent-Plugin Model)**

我们不采用单纯的抽卡，而是采用 **“指令定义方向，卡牌修正概率”** 的混合模式。

### **1.1 决策循环：Commit \-\> Execute \-\> Strategic Session**

1. **Commit (决策期)**：玩家在终端输入战略指令。所有推演指令建议以周为单位（如 `sprint --weeks 2`）。
2. **Execute (执行期)**：时间按 1s=1h 流逝。AI COO 在此阶段不仅更新数值，更在后台撰写/更新 **BACKLOG.md** 和 **MARKET_FEEDBACK.md**。
3. **Strategic Session (战略会话)**：指令周期或离线补算结束，系统触发“强制战略停顿”。AI 拿着这两周产生的“工作产出物”进行汇报，并要求玩家在继续下一步前做出关键决策（如：针对法律合规性调整 feature）。


### **1.2 行动机制：策略指令 \+ 战术卡牌**

* **战略指令 (CLI Commands)**：这是创业者的“主观意图”。  
  * 例子：sprint (研发), fund (融资), pivot (转型)。  
* **战术卡牌 (Inspirations)**：这是每一周开始时，基于创始人的 LRN 或 CHR 随机生成的“灵感”。  
  * **机制**：玩家在执行指令前，可以“挂载”最多 2 张卡牌。  
  * **效果**：例如执行 sprint 时挂载一张 \[极客之血\]，会临时提升 TEC 向量长度，但增加 Health 损耗。

## **2\. 标准实验室流速与时间动力学 (1Tick = 1Hour)**

lemeone-lab 采用“标准实验室模式”，统一设定底层主频为 **1 个现实秒 = 1 个虚拟小时**。
这种流速提供了足够的“经营焦虑感”（能实时看着现金和进度跳动），又不会快到让玩家来不及思考决策。对前端和后端的计算与通讯压力极小。

### **2.1 呼吸式日志采样 (Log Sampling)**

为了避免终端因为 1s=1h 的刷新频率而产生信息过载和刷屏效应，系统对输出日志进行聚合抽样：
对于常规的 progress 推进和现金流变动，系统**每 24 个虚拟小时（即现实中的 24 秒 / 每天一次）**进行一次统一汇总输出。只有当触发突发事件时，才会即时打断呼吸输出进行播报。

### **2.2 “战略会话”的强制触发 (Strategic Session Threshold)**

为了确保“推演”而非“看戏”，系统设立了强制性的战略会话阈值：
*   **时间强制**：最长每隔 2 个虚拟周（约 336 虚拟小时 / 336 现实秒）强制触发一次。
*   **风险熔断**：如果市场漂移或技术债积累导致共鸣度（$cos(θ)$）下跌超过 **0.15**，系统立即中断 Execute 期。
*   **语义触发**：当 AI COO 的后台任务（如撰写 BACKLOG）发现重大逻辑冲突或市场黑天鹅时，自动触发。
*   **交互效果**：系统进入暂停，终端输出：“AI 合伙人要求立即进行战略对齐…”，随后展示更新后的 **BACKLOG.md** 与 **MARKET_FEEDBACK.md**。


### **2.3 离线暂停与强制存档 (Offline Pause & Auto-Save)**

当玩家离开控制台（切换浏览器标签页、最小化窗口或断网）时：
*   **即时暂停**：系统会立即挂起时间流（触发 `[SYSTEM_PAUSED]` 状态），防止在无人值守时发生不可逆的数值崩塌或错过关键决策点。
*   **一键恢复**：玩家返回终端时，点击任意键或输入任何指令即可解除系统锁定，时间流继续。
*   **强制存档 (Auto-Save)**：在浏览器触发 `beforeunload`（关闭标签页、刷新）时，系统将强制向 Supabase 发送一次状态同步快照，确保存档数据的绝对安全，实现“下线即停，上线即连”的无缝体验。

## **3\. 终点设计：创业的三个终局 (The Endings)**

### **3.1 抵达终点的时间预期**

* **快速验证流 (Sprint Run)**：6 \- 12 小时。适合在周末进行一次完整的“单兵突击”。  
* **标准创业季 (Standard Journey)**：约 1 个月。对标现实迭代周期，每日处理 1-2 次关键决策。  
* **巨头之路 (Grand Strategy)**：3 个月以上。时间流速与现实高度同步，处理全球生态博弈。

### **3.2 三大结局类型**

1. **TITAN 飞升** (完美结局)：达成 TITAN 阶段，公司成为行业公理，存档进入“名人堂”。  
2. **退出/套现** (普通结局)：在 IPO 或 SCALE 阶段选择 exit。套现金额转化为 Lab Points。  
3. **死难者/破产** (Roguelike 结局)：现金归零或创始人身亡。AI 生成一份深刻的“尸检报告”。

## **4\. 算法升级建议：时间价值函数**

在 DRTA 算法中，加入时间作为变量：

![][image2]这意味着**时间本身就是风险**。你停留的时间越长，市场漂移得就越远。这会逼迫玩家在“追求完美产品”和“快速上线”之间做出生死抉择。

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAYAAACpF6WWAAABNklEQVR4XmNgIAIoKCg0oIsRDUCa5eXl9+PA/9HVUwSobuDgAkDvvQd5EQlfR5OHyyGLEwRycnJ1IE3AyEpAl5ORkeEEinegixMEQE32UNfMRpcDiv1EFyMKADUqggwFungHFrkl6GJEA6hLv8D4QAsEgfyXyGpIBuiRAWT/UlRU1EdWQzJANhRIl4iKivKgqyEZIBsKjLiN6PJkAZihQBykpKQkh0XeEMaWlZU1hbGBQSQPpBhhfBQA1HQdaug5dDlgpLUDxYOB+CUQe0LVvwf6SAPKfoGqAwqAEtNAhqKLgwDINUCDdwIN4YAKMQLVXoDJ49JHECBrBLKzgTgQif8BGGT8MD7RAM3Q1cDsKwRiS0tLywD5i4C+mIlQTSSQR8pZQPYfGFtLS4sNyN8LDB4lmNjQAACiGVe66TSCXgAAAABJRU5ErkJggg==>

[image2]: <data:image/png;base64,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>