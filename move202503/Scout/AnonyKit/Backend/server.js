const express = require('express');
const axios = require('axios');
const { SuiClient, getFullnodeUrl } = require('@mysten/sui.js/client');

const app = express();
app.use(express.json());

// 提交投票到 Enclave
app.post('/vote', async (req, res) => {
    const { vote } = req.body;
    if (!vote || !['A', 'B'].includes(vote)) {
        return res.status(400).json({ error: 'Invalid vote. Must be "A" or "B"' });
    }

    try {
        const response = await axios.post('http://54.250.236.83:3000/process_data', {
            vote: { vote }
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit vote to Enclave: ' + error.message });
    }
});

// 提交投票到 Sui 区块链
app.post('/submit-vote-to-blockchain', async (req, res) => {
    const { vote, signature, timestamp_ms } = req.body;
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });

    try {
        // 注意：这里需要替换为实际的 package 和 object ID
        const tx = await client.callContract({
            package: '0x123...',  // 替换为 voting_dapp 的 package ID
            module: 'voting',
            function: 'submit_vote',
            arguments: [
                '0x456...',  // 替换为 Voting 对象的 ID
                vote,
                signature,
                timestamp_ms.toString()
            ],
            gasBudget: 10000,
        });
        res.json({ success: true, tx });
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit vote to blockchain: ' + error.message });
    }
});

// 查询投票结果
app.get('/results', async (req, res) => {
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });

    try {
        const resultA = await client.callContract({
            package: '0x123...',  // 替换为 voting_dapp 的 package ID
            module: 'voting',
            function: 'get_votes',
            arguments: ['0x456...', 'A'],  // 替换为 Voting 对象的 ID
        });
        const resultB = await client.callContract({
            package: '0x123...',  // 替换为 voting_dapp 的 package ID
            module: 'voting',
            function: 'get_votes',
            arguments: ['0x456...', 'B'],  // 替换为 Voting 对象的 ID
        });
        res.json({ A: resultA, B: resultB });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch voting results: ' + error.message });
    }
});

app.listen(4000, () => console.log('Backend running on port 4000'));