const express = require('express');
const axios = require('axios');
const app = express();
const dotenv = require('dotenv');

dotenv.config();
const PORT = process.env.PORT;

app.use(express.json());

const mail = "mayur0654@chitkara.edu.in";
const api_key = process.env.API_KEY;


function fibonacci(n) {
    if (n <= 0) return [];
    if (n === 1) return [0];
    
    const fib = [0, 1];
    for (let i = 2; i < n; i++) {
        fib.push(fib[i - 1] + fib[i - 2]);
    }
    return fib;
}

function isPrime(num) {
    if (num < 2) return false;
    if (num === 2) return true;
    if (num % 2 === 0) return false;
    
    for (let i = 3; i <= Math.sqrt(num); i += 2) {
        if (num % i === 0) return false;
    }
    return true;
}

function filterPrimes(arr) {
    return arr.filter(num => isPrime(num));
}

function gcd(a, b) {
    while (b !== 0) {
        let temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

function calculateHCF(arr) {
    if (arr.length === 0) return 0;
    if (arr.length === 1) return arr[0];
    
    let result = arr[0];
    for (let i = 1; i < arr.length; i++) {
        result = gcd(result, arr[i]);
    }
    return result;
}

function lcm(a, b) {
    return (a * b) / gcd(a, b);
}

function calculateLCM(arr) {
    if (arr.length === 0) return 0;
    if (arr.length === 1) return arr[0];
    
    let result = arr[0];
    for (let i = 1; i < arr.length; i++) {
        result = lcm(result, arr[i]);
    }
    return result;
}

async function getAIResponse(question) {
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${api_key}`,{
                contents: [{
                    parts: [{
                        text: `try to answer the following question with only one word or two words max to max : ${question}`
                    }]
                }]
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const answer = response.data.candidates[0].content.parts[0].text.trim();
        return answer;
    } catch (error) {
        console.error('AI API Error:', error.response?.data || error.message);
        throw new Error('Failed to get AI response');
    }
}

app.post('/bfhl', async (req, res) => {
    try {
        const body = req.body;
        
        // Check if body is empty or not an object
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return res.status(400).json({
                is_success: false,
                error: 'Request body must be a valid JSON object'
            });
        }
        
        const keys = Object.keys(body);
        
        // Validate exactly one key
        if (keys.length !== 1) {
            return res.status(400).json({
                is_success: false,
                error: 'Request must contain exactly one key'
            });
        }
        
        const originalKey = keys[0];
        const key = originalKey.toLowerCase(); // Convert to lowercase for case-insensitive matching
        const value = body[originalKey];
        let data;
        
        switch (key) {
            case 'fibonacci':
                if (typeof value !== 'number' || value < 0 || !Number.isInteger(value)) {
                    return res.status(400).json({
                        is_success: false,
                        error: 'fibonacci requires a non-negative integer. Received invalid data format.'
                    });
                }
                data = fibonacci(value);
                break;
                
            case 'prime':
                if (!Array.isArray(value)) {
                    return res.status(400).json({
                        is_success: false,
                        error: 'prime requires an array of integers. Received invalid data format.'
                    });
                }
                if (!value.every(num => typeof num === 'number' && Number.isInteger(num))) {
                    return res.status(400).json({
                        is_success: false,
                        error: 'prime array must contain only integers. Received invalid data format.'
                    });
                }
                data = filterPrimes(value);
                break;
                
            case 'lcm':
                if (!Array.isArray(value) || value.length === 0) {
                    return res.status(400).json({
                        is_success: false,
                        error: 'lcm requires a non-empty array of integers. Received invalid data format.'
                    });
                }
                if (!value.every(num => typeof num === 'number' && Number.isInteger(num) && num > 0)) {
                    return res.status(400).json({
                        is_success: false,
                        error: 'lcm array must contain only positive integers. Received invalid data format.'
                    });
                }
                data = calculateLCM(value);
                break;
                
            case 'hcf':
                if (!Array.isArray(value) || value.length === 0) {
                    return res.status(400).json({
                        is_success: false,
                        error: 'hcf requires a non-empty array of integers. Received invalid data format.'
                    });
                }
                if (!value.every(num => typeof num === 'number' && Number.isInteger(num) && num > 0)) {
                    return res.status(400).json({
                        is_success: false,
                        error: 'hcf array must contain only positive integers. Received invalid data format.'
                    });
                }
                data = calculateHCF(value);
                break;
                
            case 'ai':
                if (typeof value !== 'string' || value.trim() === '') {
                    return res.status(400).json({
                        is_success: false,
                        error: 'AI requires a non-empty question string. Received invalid data format.'
                    });
                }
                data = await getAIResponse(value);
                break;
                
            default:
                return res.status(400).json({
                    is_success: false,
                    error: `Unknown key: ${originalKey}. Valid keys are: fibonacci, prime, lcm, hcf, AI (case-insensitive)`
                });
        }
        
        res.json({
            is_success: true,
            official_email: mail,
            data: data
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            is_success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// GET /health endpoint
app.get('/health', (req, res) => {
    res.json({
        is_success: true,
        official_email: mail
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
