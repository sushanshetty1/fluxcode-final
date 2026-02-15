const LEETCODE_GRAPHQL_ENDPOINT = "https://leetcode.com/graphql";

export async function fetchLeetCodeProblems(params: {
  tags: string[];
  difficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  limit: number;
}): Promise<Array<{
  questionFrontendId: string;
  title: string;
  titleSlug: string;
  difficulty: string;
  topicTags: Array<{ name: string }>;
}>> {
  const query = `
    query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
      problemsetQuestionList: questionList(
        categorySlug: $categorySlug
        limit: $limit
        skip: $skip
        filters: $filters
      ) {
        questions: data {
          questionFrontendId
          title
          titleSlug
          difficulty
          topicTags {
            name
          }
        }
      }
    }
  `;

  const allProblems: Array<{
    questionFrontendId: string;
    title: string;
    titleSlug: string;
    difficulty: string;
    topicTags: Array<{ name: string }>;
  }> = [];

  // Fetch problems by difficulty
  if (params.difficulty.easy > 0) {
    const easyProblems = await fetchByDifficulty("EASY", params.tags, params.difficulty.easy, query);
    allProblems.push(...easyProblems);
  }
  
  if (params.difficulty.medium > 0) {
    const mediumProblems = await fetchByDifficulty("MEDIUM", params.tags, params.difficulty.medium, query);
    allProblems.push(...mediumProblems);
  }
  
  if (params.difficulty.hard > 0) {
    const hardProblems = await fetchByDifficulty("HARD", params.tags, params.difficulty.hard, query);
    allProblems.push(...hardProblems);
  }

  return allProblems.slice(0, params.limit);
}

async function fetchByDifficulty(
  difficulty: string,
  tags: string[],
  limit: number,
  query: string
): Promise<Array<{
  questionFrontendId: string;
  title: string;
  titleSlug: string;
  difficulty: string;
  topicTags: Array<{ name: string }>;
}>> {
  const variables = {
    categorySlug: "",
    limit,
    skip: 0,
    filters: {
      difficulty,
      tags: tags.length > 0 ? tags : undefined,
    },
  };

  const response = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Referer": "https://leetcode.com",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch LeetCode problems: ${response.statusText}`);
  }

  const data = await response.json() as {
    data: {
      problemsetQuestionList: {
        questions: Array<{
          questionFrontendId: string;
          title: string;
          titleSlug: string;
          difficulty: string;
          topicTags: Array<{ name: string }>;
        }>;
      };
    };
  };

  return data.data.problemsetQuestionList.questions;
}

export async function verifyLeetCodeSolution(
  username: string,
  problemTitle: string,
  titleSlug?: string
): Promise<boolean> {
  // Use provided titleSlug if available, otherwise convert from title
  const problemSlug = titleSlug ?? problemTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-'); // Replace spaces with hyphens

  // Check user's recent submissions
  const query = `
    query recentAcSubmissions($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        id
        title
        titleSlug
        timestamp
      }
    }
  `;

  const variables = {
    username,
    limit: 20, // Check last 20 accepted submissions
  };

  const response = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to verify LeetCode solution");
  }

  const data = await response.json() as {
    data: {
      recentAcSubmissionList: Array<{
        id: string;
        title: string;
        titleSlug: string;
        timestamp: string;
      }>;
    };
  };

  const submissions = data.data.recentAcSubmissionList;
  
  // Check if the problem's titleSlug is in the user's recent accepted submissions
  // Match by titleSlug OR by exact title (case-insensitive) as fallback
  const solved = submissions.some(
    (submission) => 
      submission.titleSlug === problemSlug || 
      submission.title.toLowerCase() === problemTitle.toLowerCase()
  );

  return solved;
}

export async function getUserLeetCodeStats(username: string) {
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          ranking
          reputation
        }
        submitStats {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
  `;

  const variables = { username };

  const response = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch LeetCode stats");
  }

  const data = await response.json() as {
    data: {
      matchedUser: {
        username: string;
        profile: {
          ranking: number;
          reputation: number;
        };
        submitStats: {
          acSubmissionNum: Array<{
            difficulty: string;
            count: number;
          }>;
        };
      };
    };
  };

  return data.data.matchedUser;
}
