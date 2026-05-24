const DEFAULT_LIMIT = 10;

class DB {
    // Không cần gọi init() nữa vì Firestore tự quản lý, nhưng giữ lại để tương thích cấu trúc nếu cần
    static async init() {}

    static async getUsers() {
        const snapshot = await db.collection('users').get();
        return snapshot.docs.map(doc => doc.data());
    }

    static async getUser(uid) {
        const doc = await db.collection('users').doc(uid).get();
        if (doc.exists) {
            return doc.data();
        }
        return null;
    }

    // Auth.js sẽ lo phần tạo user trên Firebase Auth, hàm này chỉ lưu thông tin phụ (role, limit) vào Firestore
    static async saveUserToFirestore(uid, username, role = 'user') {
        const userRef = db.collection('users').doc(uid);
        await userRef.set({
            uid: uid,
            username: username,
            role: role,
            dailyLimit: role === 'admin' ? 9999 : DEFAULT_LIMIT,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return await this.getUser(uid);
    }

    static async updateUserLimit(uid, newLimit) {
        const userRef = db.collection('users').doc(uid);
        await userRef.update({
            dailyLimit: newLimit
        });
        return true;
    }

    static async getTodayUsage(uid) {
        const today = new Date().toISOString().split('T')[0];
        const docRef = db.collection('usage').doc(`${uid}_${today}`);
        const doc = await docRef.get();
        
        if (doc.exists) {
            return doc.data().count;
        } else {
            return 0;
        }
    }

    static async incrementUsage(uid) {
        const today = new Date().toISOString().split('T')[0];
        const docRef = db.collection('usage').doc(`${uid}_${today}`);
        
        // Sử dụng transaction hoặc increment để tránh xung đột
        await docRef.set({
            uid: uid,
            date: today,
            count: firebase.firestore.FieldValue.increment(1)
        }, { merge: true });
        
        const updatedDoc = await docRef.get();
        return updatedDoc.data().count;
    }

    static async saveHistory(uid, problem, solution) {
        await db.collection('history').add({
            uid: uid,
            problem: problem || '[Có chứa ảnh]',
            solution: solution,
            date: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    static async getHistory(uid, limitCount = 50) {
        const snapshot = await db.collection('history')
                                 .where('uid', '==', uid)
                                 .orderBy('date', 'desc')
                                 .limit(limitCount)
                                 .get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date ? data.date.toDate().toISOString() : new Date().toISOString()
            };
        });
    }
}
