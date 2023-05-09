import express from 'express';
import { LeetCode } from 'leetcode-query';
import axios from 'axios';
import morgan from 'morgan';
import cors from 'cors';

const app = express();
const port = 3000;
const leetcode = new LeetCode();

app.use(express.json());
app.use(morgan('tiny'));
app.use(cors());

const recentSubmissionsMap = new Map();

app.post("/username", async (req, res) => {
    try {
        const { username } = req.body;
        const user = await leetcode.user(username);
        if (!user || !user.matchedUser) {
            res.status(400).json({ error: "Invalid username" });
            return;
        }
        const data = extractData(user);
        recentSubmissionsMap.set(username, data.recentSubmissionList);
        const jsQuestions = await fetchJsonObject();

        // Create a Map to store unique accepted question titles
        const acceptedQuestionsMap = new Map();

        data.recentSubmissionList.forEach(submission => {
            if (jsQuestions[0].questions.includes(submission.title) &&
                submission.statusDisplay === 'Accepted') {
                acceptedQuestionsMap.set(submission.title, submission);
            }
        });

        // Convert the Map back to an array
        const acceptedQuestions = Array.from(acceptedQuestionsMap.values());

        const count = acceptedQuestions.length;
        res.status(200).json({ message: "Username submitted successfully", count, acceptedQuestions });
    } catch (error) {
        console.error("Error in POST /username:", error);
        res.status(500).json({ error: "An error occurred while processing the request" });
    }
});



app.get('/jsquestions', async (req, res) => {
    try {
        const jsQuestions = await fetchJsonObject();
        res.status(200).json(jsQuestions);
    } catch (error) {
        console.error("Error in GET /jsquestions:", error);
        res.status(500).json({ error: "An error occurred while fetching the JSON object" });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

const extractData = (input) => {
    const {
        matchedUser: { username },
        matchedUser: {
            profile: { realName },
        },
        recentSubmissionList,
    } = input;

    const data = {
        username,
        realName,
        recentSubmissionList: recentSubmissionList.map(({ title, timestamp, statusDisplay, lang }) => ({
            title,
            timestamp,
            statusDisplay,
            lang,
        })),
    };

    return data;
};

const fetchJsonObject = async () => {
    const corsProxy = 'https://api.allorigins.win/raw?url=';
    const url = 'https://leetcode.blob.core.windows.net/leetcode30day/leetcode30days.json';

    try {
        const response = await axios.get(corsProxy + url, {
            headers: {
                'x-requested-with': 'XMLHttpRequest',
            },
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching JSON object:', error);
    }
};

// app.get('/count/:username', async (req, res) => {
//     const username = req.params.username;
//     const recentSubmissions = recentSubmissionsMap.get(username) || [];
//     const jsQuestions = await fetchJsonObject();

//     const count = recentSubmissions.filter(submission =>
//         submission.statusDisplay === 'Accepted' && jsQuestions[0].questions.includes(submission.title)
//     ).length;
//     res.status(200).send({ count });
// });
