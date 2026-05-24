export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { problem, selectedClass, imageBase64, imageMimeType } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Server chưa cấu hình GEMINI_API_KEY' });
    }

    try {
        // Mặc định dùng gemini-2.0-flash hoặc gemini-1.5-pro tùy cấu hình
        // Google khuyến nghị gemini-2.5-pro hoặc gemini-2.0-flash cho đa phương thức
        const modelName = 'gemini-2.0-flash'; 
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const prompt = `Bạn là một gia sư toán học xuất sắc tại Việt Nam. 
Học sinh của bạn đang học ${selectedClass} theo chương trình giáo dục phổ thông Việt Nam.
Hãy giải bài toán sau một cách chi tiết, từng bước dễ hiểu, phù hợp với kiến thức của ${selectedClass}. 
Cuối cùng, hãy đưa ra đáp án rõ ràng. Sử dụng định dạng Markdown để trình bày đẹp mắt (dùng $$ cho công thức hiển thị riêng 1 dòng, $ cho công thức hiển thị trong dòng), in đậm đáp án.
Bài toán: ${problem || ''}`;

        const parts = [{ text: prompt }];

        if (imageBase64 && imageMimeType) {
            parts.push({
                inlineData: {
                    data: imageBase64,
                    mimeType: imageMimeType
                }
            });
        }

        const payload = {
            contents: [{
                parts: parts
            }]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(JSON.stringify(errData));
        }

        const data = await response.json();

        if (!data.candidates || data.candidates.length === 0) {
            throw new Error('API không trả về ứng viên nào.');
        }

        const candidate = data.candidates[0];
        if (candidate.finishReason !== 'STOP' && candidate.finishReason !== undefined) {
            throw new Error(`AI bị dừng do lý do: ${candidate.finishReason}`);
        }

        if (candidate.content && candidate.content.parts && candidate.content.parts[0].text) {
            return res.status(200).json({ solution: candidate.content.parts[0].text });
        } else {
            throw new Error('Không tìm thấy văn bản trả về.');
        }
    } catch (error) {
        console.error('Gemini API Error:', error);
        return res.status(500).json({ error: error.message || 'Lỗi khi gọi AI' });
    }
}
