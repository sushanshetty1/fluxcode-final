"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

type Topic = {
  name: string;
  description: string;
  subcategories: string[];
  questionsPerTopic: number;
  difficulty: string;
  easy: number;
  medium: number;
  hard: number;
};

const LEETCODE_TOPICS = [
  { name: "Array", description: "Master array manipulation, traversal, and common patterns" },
  { name: "String", description: "String processing, pattern matching, and manipulation" },
  { name: "Hash Table", description: "Fast lookups and frequency counting with hash maps" },
  { name: "Dynamic Programming", description: "Solve complex problems by breaking them into subproblems" },
  { name: "Math", description: "Mathematical algorithms and number theory" },
  { name: "Sorting", description: "Different sorting algorithms and their applications" },
  { name: "Greedy", description: "Make locally optimal choices for global optimization" },
  { name: "Depth-First Search", description: "Explore graphs and trees depth-first" },
  { name: "Binary Search", description: "Efficient searching in sorted data" },
  { name: "Database", description: "SQL queries and database optimization" },
  { name: "Breadth-First Search", description: "Level-order traversal and shortest paths" },
  { name: "Tree", description: "Binary trees, BSTs, and tree traversals" },
  { name: "Matrix", description: "2D array operations and matrix algorithms" },
  { name: "Two Pointers", description: "Efficient array/string problems with multiple pointers" },
  { name: "Binary Tree", description: "Binary tree specific algorithms and patterns" },
  { name: "Bit Manipulation", description: "Bitwise operations and bit tricks" },
  { name: "Stack", description: "LIFO data structure and its applications" },
  { name: "Heap (Priority Queue)", description: "Priority-based data structure operations" },
  { name: "Graph", description: "Graph algorithms, traversals, and shortest paths" },
  { name: "Prefix Sum", description: "Cumulative sum techniques for range queries" },
  { name: "Simulation", description: "Step-by-step process simulation problems" },
  { name: "Sliding Window", description: "Subarray/substring problems with fixed/variable windows" },
  { name: "Linked List", description: "Pointer manipulation and linked list operations" },
  { name: "Backtracking", description: "Explore all solutions with pruning" },
  { name: "Divide and Conquer", description: "Break problems into smaller subproblems" },
];

export default function CreateContest() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [startDate, setStartDate] = useState("");
  const [easyProblemsPerDay, setEasyProblemsPerDay] = useState(2);
  const [mediumProblemsPerDay, setMediumProblemsPerDay] = useState(1);
  const [hardDaysPerProblem, setHardDaysPerProblem] = useState(2);
  const [topics, setTopics] = useState<Topic[]>(
    LEETCODE_TOPICS.map(lt => ({
      name: lt.name,
      description: lt.description,
      subcategories: [lt.name],
      questionsPerTopic: 10,
      difficulty: "Mixed",
      easy: 3,
      medium: 5,
      hard: 2,
    }))
  );
  const [editingTopic, setEditingTopic] = useState<number | null>(null);
  const [questionsPerTopic, setQuestionsPerTopic] = useState(10);
  const [easy, setEasy] = useState(3);
  const [medium, setMedium] = useState(5);
  const [hard, setHard] = useState(2);
  const [globalQuestions, setGlobalQuestions] = useState(10);
  const [globalEasy, setGlobalEasy] = useState(3);
  const [globalMedium, setGlobalMedium] = useState(5);
  const [globalHard, setGlobalHard] = useState(2);

  const createContest = api.contest.createWithTopics.useMutation({
    onSuccess: (data) => {
      router.push(`/contest/${data.id}`);
    },
  });

  const applyToAllTopics = () => {
    setTopics(topics.map(topic => ({
      ...topic,
      questionsPerTopic: globalQuestions,
      easy: globalEasy,
      medium: globalMedium,
      hard: globalHard,
    })));
  };

  const updateTopic = (index: number) => {
    const updated = [...topics];
    updated[index] = {
      ...updated[index]!,
      questionsPerTopic,
      easy,
      medium,
      hard,
    };
    setTopics(updated);
    setEditingTopic(null);
    setQuestionsPerTopic(10);
    setEasy(3);
    setMedium(5);
    setHard(2);
  };

  const startEditTopic = (index: number) => {
    const topic = topics[index]!;
    setEditingTopic(index);
    setQuestionsPerTopic(topic.questionsPerTopic);
    setEasy(topic.easy);
    setMedium(topic.medium);
    setHard(topic.hard);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const activeTopics = topics.filter(t => t.questionsPerTopic > 0);
    if (activeTopics.length === 0) {
      alert("Please select at least one topic (set questions > 0)");
      return;
    }
    createContest.mutate({
      name,
      description,
      password: password || undefined,
      startDate: new Date(startDate),
      easyProblemsPerDay,
      mediumProblemsPerDay,
      hardDaysPerProblem,
      topics: activeTopics,
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="mb-8 text-3xl font-bold text-white">Create New Contest</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg bg-gray-800 p-8 shadow space-y-6">
            <h2 className="text-xl font-bold text-white">Contest Details</h2>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                Contest Name *
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-700 text-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-700 text-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password (optional)
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave empty for public contest"
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-700 text-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                Set a password to make the contest private. Users will need this password to join.
              </p>
            </div>

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-300">
                Start Date *
              </label>
              <input
                id="startDate"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-700 text-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="easyProblemsPerDay" className="block text-sm font-medium text-green-400">
                  Easy Problems/Day *
                </label>
                <input
                  id="easyProblemsPerDay"
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={easyProblemsPerDay}
                  onChange={(e) => setEasyProblemsPerDay(parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-700 text-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-400">Problems unlocked daily</p>
              </div>
              <div>
                <label htmlFor="mediumProblemsPerDay" className="block text-sm font-medium text-yellow-400">
                  Medium Problems/Day *
                </label>
                <input
                  id="mediumProblemsPerDay"
                  type="number"
                  min="1"
                  max="5"
                  required
                  value={mediumProblemsPerDay}
                  onChange={(e) => setMediumProblemsPerDay(parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-700 text-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-400">Problems unlocked daily</p>
              </div>
              <div>
                <label htmlFor="hardDaysPerProblem" className="block text-sm font-medium text-red-400">
                  Hard Days/Problem *
                </label>
                <input
                  id="hardDaysPerProblem"
                  type="number"
                  min="1"
                  max="7"
                  required
                  value={hardDaysPerProblem}
                  onChange={(e) => setHardDaysPerProblem(parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-700 text-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-400">Days per hard problem</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-gray-800 p-8 shadow space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Topics</h2>
              <p className="text-sm text-gray-400">Set questions to 0 to exclude a topic</p>
            </div>

            <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
              <h3 className="text-sm font-semibold text-white mb-3">Apply to All Topics</h3>
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Total Questions</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={globalQuestions}
                    onChange={(e) => setGlobalQuestions(parseInt(e.target.value))}
                    className="block w-full rounded-md border border-gray-700 bg-gray-700 text-white px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-green-400 mb-1">Easy</label>
                  <input
                    type="number"
                    min="0"
                    value={globalEasy}
                    onChange={(e) => setGlobalEasy(parseInt(e.target.value))}
                    className="block w-full rounded-md border border-gray-700 bg-gray-700 text-white px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-yellow-400 mb-1">Medium</label>
                  <input
                    type="number"
                    min="0"
                    value={globalMedium}
                    onChange={(e) => setGlobalMedium(parseInt(e.target.value))}
                    className="block w-full rounded-md border border-gray-700 bg-gray-700 text-white px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-red-400 mb-1">Hard</label>
                  <input
                    type="number"
                    min="0"
                    value={globalHard}
                    onChange={(e) => setGlobalHard(parseInt(e.target.value))}
                    className="block w-full rounded-md border border-gray-700 bg-gray-700 text-white px-2 py-1 text-sm"
                  />
                </div>
              </div>
              {(globalEasy + globalMedium + globalHard) !== globalQuestions && (
                <p className="text-xs text-red-400 mb-2">
                  Distribution ({globalEasy + globalMedium + globalHard}) must equal total ({globalQuestions})
                </p>
              )}
              <Button
                type="button"
                size="sm"
                onClick={applyToAllTopics}
                disabled={(globalEasy + globalMedium + globalHard) !== globalQuestions}
                className="w-full"
              >
                Apply to All Topics
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto">
              {topics.map((topic, index) => (
                <div 
                  key={index} 
                  className={`border rounded-lg p-4 space-y-2 ${
                    topic.questionsPerTopic === 0 
                      ? 'border-gray-700 bg-gray-800/50 opacity-50' 
                      : 'border-gray-600 bg-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{topic.name}</h3>
                      <p className="text-sm text-gray-400">{topic.description}</p>
                      
                      {editingTopic === index ? (
                        <div className="mt-3 space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">Total Questions</label>
                            <input
                              type="number"
                              min="0"
                              max="50"
                              value={questionsPerTopic}
                              onChange={(e) => setQuestionsPerTopic(parseInt(e.target.value))}
                              className="block w-32 rounded-md border border-gray-700 bg-gray-700 text-white px-2 py-1 text-sm"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-green-400">Easy</label>
                              <input
                                type="number"
                                min="0"
                                value={easy}
                                onChange={(e) => setEasy(parseInt(e.target.value))}
                                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-700 text-white px-2 py-1 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-yellow-400">Medium</label>
                              <input
                                type="number"
                                min="0"
                                value={medium}
                                onChange={(e) => setMedium(parseInt(e.target.value))}
                                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-700 text-white px-2 py-1 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-red-400">Hard</label>
                              <input
                                type="number"
                                min="0"
                                value={hard}
                                onChange={(e) => setHard(parseInt(e.target.value))}
                                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-700 text-white px-2 py-1 text-sm"
                              />
                            </div>
                          </div>
                          {(easy + medium + hard) !== questionsPerTopic && (
                            <p className="text-xs text-red-400">
                              Total ({easy + medium + hard}) must equal {questionsPerTopic}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => updateTopic(index)}
                              disabled={(easy + medium + hard) !== questionsPerTopic}
                            >
                              Save
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingTopic(null);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center gap-4">
                          {topic.questionsPerTopic > 0 ? (
                            <div className="text-sm text-gray-400">
                              {topic.questionsPerTopic} problems: <span className="text-green-400">{topic.easy}E</span> / <span className="text-yellow-400">{topic.medium}M</span> / <span className="text-red-400">{topic.hard}H</span>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">
                              Excluded (0 problems)
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {editingTopic !== index && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => startEditTopic(index)}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createContest.isPending ?? topics.filter(t => t.questionsPerTopic > 0).length === 0}
              className="flex-1"
            >
              {createContest.isPending ? "Creating Contest..." : "Create Contest"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
