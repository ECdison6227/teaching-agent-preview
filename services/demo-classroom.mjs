// In-memory UI demonstration only. A server must enforce real classroom rules.
export class DemoClassroom {
  constructor(questions) {
    this.questions = structuredClone(questions);
    this.currentRound = null;
    this.sequence = 0;
    this.submissions = new Map();
  }

  listQuestions(group = "全部") {
    return structuredClone(
      this.questions.filter((q) => group === "全部" || q.group === group),
    );
  }

  createRound(questionIds) {
    const ids = [...new Set(questionIds)];
    if (
      !ids.length ||
      ids.some((id) => !this.questions.some((q) => q.id === id))
    ) {
      throw new Error("请至少选择一道有效的示例题。");
    }
    this.currentRound = {
      id: `demo-round-${++this.sequence}`,
      questionIds: ids,
    };
    this.submissions = new Map();
    return structuredClone(this.currentRound);
  }

  requireRound(id) {
    if (!this.currentRound || this.currentRound.id !== id)
      throw new Error("演示课堂已切换，请重新打开学生视角。");
    return this.currentRound;
  }

  submit(roundId, browserId, answers) {
    const round = this.requireRound(roundId);
    if (this.submissions.has(browserId)) return false;
    if (
      Object.keys(answers).length !== round.questionIds.length ||
      round.questionIds.some((id) => {
        const question = this.questions.find((q) => q.id === id);
        return !question.options.some((option) => option.id === answers[id]);
      })
    )
      throw new Error("请完成所有题目的选项。");
    this.submissions.set(browserId, { ...answers });
    return true;
  }

  report(roundId) {
    const round = this.requireRound(roundId);
    const submissions = this.submissions.size;
    return {
      submissions,
      questions: round.questionIds.map((id) => {
        const question = this.questions.find((q) => q.id === id);
        return {
          id,
          responses: submissions,
          options: question.options.map((option) => {
            const count = [...this.submissions.values()].filter(
              (answer) => answer[id] === option.id,
            ).length;
            return {
              id: option.id,
              count,
              percent: submissions
                ? Math.round((count / submissions) * 100)
                : null,
            };
          }),
        };
      }),
    };
  }

  loadSample(roundId) {
    const round = this.requireRound(roundId);
    for (let i = 0; i < 48; i++) {
      const answers = Object.fromEntries(
        round.questionIds.map((id, index) => {
          const options = this.questions.find((q) => q.id === id).options;
          const position =
            i < 12
              ? 0
              : options.length === 2
                ? 1
                : ((i + index) % (options.length - 1)) + 1;
          return [id, options[position].id];
        }),
      );
      this.submit(round.id, `sample-${i}`, answers);
    }
  }
}
