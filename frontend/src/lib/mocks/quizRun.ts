export type BetchaMultiplier = 1 | 3 | 5

export type QuizRunMode = 'solo' | 'duel' | 'tempo'

export type MockQuestion = {
  id: string
  prompt: string
  choices: string[]
  correctIndex: number
}

export const mockQuizQuestions: MockQuestion[] = [
  {
    id: 'q1',
    prompt: 'Which of the following best describes a directed graph?',
    choices: [
      'Edges have no direction',
      'Edges point from one vertex to another',
      'Every vertex has the same degree',
      'There are no cycles allowed',
    ],
    correctIndex: 1,
  },
  {
    id: 'q2',
    prompt: 'What is the time complexity of binary search on a sorted array?',
    choices: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
    correctIndex: 1,
  },
  {
    id: 'q3',
    prompt: 'Induction proofs require which two steps?',
    choices: [
      'Base case and inductive step',
      'Hypothesis and conclusion',
      'Lemma and corollary',
      'Premise and contradiction',
    ],
    correctIndex: 0,
  },
]

export type QuizRunLocationState = {
  mode: QuizRunMode
  betcha: BetchaMultiplier
  lessonId: string
  courseName?: string
}

export type QuizResultsLocationState = {
  mode: QuizRunMode
  betcha: BetchaMultiplier
  correctCount: number
  totalQuestions: number
  coinsEarned: number
  betchaOutcome: string
}
