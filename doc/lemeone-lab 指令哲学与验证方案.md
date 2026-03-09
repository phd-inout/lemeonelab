# **lemeone-lab：指令哲学与语义解析方案 (Hybrid Intent Logic)**

为了解决“指令无法覆盖所有场景”以及“硬核与易用性矛盾”的问题，本项目采用**双轨制指令解析系统**。

## **1\. 指令双轨制架构 (The Dual-Track Architecture)**

### **1.1 静态指令集 (Static CLI \- System 1\)**

* **特性**：严格、高效、零 Token 消耗。  
* **适用场景**：高频、重复的资源管理（sprint, hire, status, rest）。  
* **技术实现**：简单的正则匹配或字符串分支。

### **1.2 动态意图引擎 (Dynamic Intent \- System 2\)**

* **特性**：口语化、发散性、高含金量。  
* **适用场景**：非标准决策（“去大学里招募免费实习生”、“把公司卖给竞争对手”）。  
* **工程化建议**：在实现时，你可以在终端里设置一个特殊的引导。例如当用户输入一段话时，光标颜色从 Cyan 变为 Purple，代表正在进入 **“AI 意图解析层”**，这种仪式感会让用户觉得系统非常智能。  
* **技术实现**：  
  1. 当 CLI 无法匹配时，输入被送往 Gemini。  
  2. AI 根据当前 CompanyState 判定该行为对 **DRTA 向量** 的修改幅度。  
  3. 输出格式化后的 StateModifier（状态修正符）。

## **2\. 深度案例分析：处理“退出/并购”指令 (M\&A Logic)**

当用户输入“把公司卖给竞争对手”时，AI 引擎将通过以下三个维度进行逻辑判定：

### **2.1 判定准入：卖得掉吗？ (The "Buy-or-Wait" Logic)**

AI 首先检查竞争对手的动机（基于当前市场共鸣度）：

* **恶意收购 (Acquihire)**：如果你的 Cash \< 0 且 Moat \< 20，对手判定你即将倒闭。此时 AI 可能返回：“对方拒绝了溢价收购，仅愿意以极低价格吸收你的技术团队（团队解散，仅偿还债务）。”  
* **战略防御 (Strategic Buy)**：如果你的 Moat \> 50 且 Progress \> 80%，你已构成威胁。AI 会判定为：“对方感到威胁，启动紧急收购谈判。”

### **2.2 估值模型：卖多少钱？ (Valuation Formula)**

最终成交价 ![][image1] 并非固定，而是受创始人属性加成的非线性函数：

* ![][image2]**$CHR (魅力)** 越高，溢价能力越强。  
* **$FIN (财务)** 越高，在条款谈判（Term Sheet）中越能避开对方的压价陷阱。  
* **共鸣度 (Resonance)** 越高，代表你的产品对行业越重要，溢价越高。

### **2.3 谈判结果的分支 (Outcome Branching)**

* **大获全胜**：溢价 200% 成交。结局：\[退出/套现\]，获得巨额 Lab Points。  
* **屈辱离场**：平价或折价成交。结局：创始人财务自由但 Reputation 下降。  
* **谈判破裂**：对方利用谈判时间差恶意抄袭。结果：Moat \-20%，竞争对手进度增加。

## **3\. 典型用户行为路径模拟 (User Journey Simulation)**

### **情景：玩家 Derek (22岁) 面对现金流危机**

| 玩家输入 (Command/Natural Language) | 解析逻辑 (Mechanism) | 引擎反馈 (Engine Output) |
| :---- | :---- | :---- |
| sprint \--weeks 4 | **Static** | 进度 \+100，现金 \-2000，健康 \-5。 |
| "我受够了，我要去借高利贷度过下个月" | **Dynamic** | **AI 判定**：解锁临时高额现金，但 FIN 属性永久受损，且后续 BurnRate 翻倍。 |
| market-scan | **Static** | 揭示市场向量 ![][image3]：\[TEC: 0.8, MKT: 0.2...\] |
| "把我的所有代码在 GitHub 开源，吸引极客关注" | **Dynamic** | **AI 判定**：Moat (护城河) 下降，但 Reputation 暴涨，CHR 向量对齐度增加。 |

## **4\. 指令覆盖率的本质：意图插值**

为什么不需要设计“所有指令”？

因为创业的本质是**资源交换**。任何口语指令，AI 都可以将其归类为以下四种“物理影响”：

1. **属性交换**：用 A 属性换 B 属性。  
2. **资源转换**：用 A 资源换 B 资源。  
3. **向量扭转**：修改公司向量 ![][image4] 的偏向，试图与市场共鸣。  
4. **状态锁定**：触发一个持续 N 周的 Buf/Debuff。

## **5\. 游戏性建议：AI 的“不确定性响应”**

为了增加含金量，当用户输入口语指令时，AI 应该给出“有概率的反馈”：

* **用户输入**：“去酒吧找之前的上司聊聊，看他能不能投一点。”  
* **AI 逻辑**：根据玩家的 CHR（魅力）进行概率判定。成功则触发 \[EVENT\_ANGEL\_FUNDING\]，失败则浪费时间且损耗 CHR。

## **6\. 总结**

通过这种设计，lemeone-lab 既保留了 **Hardcore CLI** 的快速操作感，又拥有了 **AI Agent** 的无限可能性。玩家不再是“玩游戏”，而是在“调教系统”。

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAAWCAYAAAAb+hYkAAAAzklEQVR4XmNgGOZAXl7eUk5OzkZRUdEOhIFsa1lZWVMZGRlddLVwIC4uzg3UKAnE/4EKpdXV1XmBmqQUFBTSQWJKSkr86HrAAGh6GkgBujhQ7CUQ/0UXBwOgpkdAyfPo4iCDgPguujgD0BmJIEkg7Y8sDnSqCtR2RmRxMAAqXgjVJAATA/K9gfgZEE9BVgsHUCeAcAsQNwNxjbKyshi6OhQA04QujhMA3a0K1bQIXQ4ngMUFKDDQ5bACoOJgIP4CxH+BmhKAWANdzSgYUAAAHRQxFf+vCKsAAAAASUVORK5CYII=>

[image2]: <data:image/png;base64,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>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAUCAYAAACAl21KAAABVUlEQVR4XrWTvS8FURDFV6HxkVBsNjbZ78TqFNuJQitaT4iGSCQS0SpR6kUiSp1OIzq1f0Gp1qAQkYffPHvtfePj3Vc4yWTnnjP3zNy7u57ngDRN5zT3J9iwnyTJ9S/xruv7hpj0PZWGGMhEmv9fxHG8SOc1YoXuq6w3jeb7/gj8FvwGz3W0cXvvN1B4LHdB4Z7WqqoaRGs73ROF27XRrtbCMBzC5EDzPyLLsun67VzYPOsp+Beb6wkxIu4V90BM2FxP1EZfHx7TjHHUHbvGCdqI/NXWnWEbySQyka5xgm0kd6N1Z7D5rTabz/N8UutMuWRy+XjrdIB82fAdUHgjRgi3XYLXaXJELBCPxEzNtaMoKnStdDk0R9Moy3KURldBEAwbjvWd0ZrKT2EWs5Mu0gJNnkxeFEXE+kxy9rWaKgfY05KfmmORPzdVDmDac5Mn1m9DfvkBgF5Yrhc5I0oAAAAASUVORK5CYII=>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACUAAAAVCAYAAADB5CeuAAAB/klEQVR4Xu2Uuy/DURTHW48IYZIGff3600olREQHg4HRxmQxs5HuDEIMFmEQ/gCLRBgkIh0QsXo0YrSwkRDBYPD4nLi3bm5+bdpBu/gmJ/ec73ncc8/v/q7PVwRisdiQzZUNbD7nOM5RHvmy4ysKaaii0/pHIfB5HuQTGfKqfa7r9pi+aDQ6YOb+Kbgz6UKXGd+hzf052LTPq6lAINAIf2fzZUEoFGr2agpuGbmy+bJBmpLJGFQ1d2jDsMsPaYq7NWzYL6a/IlB/2KLoNDeK7toxXiBuFnm2eS9ILIvf5vNCTepE6Vnbnw/qMGs2byMSiXRLrM0XBAkf3KFbGusXsf2CcDhcb05Q2dLUOGa15nnfHGp0ajuVStVSe1piJUfzgmAw2ADfZnI54DhVG3g+AXLfZCOKdji/D6wf/dKMw34y9Nxk0O/NWKmH/e77OUyNeYgcCFjAsWXzGpx0XYqwjhncNDkjhj1FzIy2rabkeuRilZ1BVtD3NF8S5CRITIohN8KxPmq/+gyf8qnEZqIh7M14PB7BrEK/ED6RSARU7gd6nc4vGUygXRelrxP0XdGtSbjItZEzgUzCnZPTKxNR+RkV/8ZSo+O5hy1aLxZy0jNkh6KDmmTTA7htuCWxWVtVE6v4utCPk8lkk8rPSqxPPQno88grsk98Wtf8R7H4BqTojSKrRJ88AAAAAElFTkSuQmCC>