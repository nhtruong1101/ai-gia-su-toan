document.addEventListener('DOMContentLoaded', () => {
    // Không còn API Key modal ở client
});

// Hàm load dữ liệu lên bảng Admin
async function loadAdminData() {
    const usersTableBody = document.getElementById('usersTableBody');
    usersTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center">Đang tải dữ liệu...</td></tr>';

    try {
        const users = await DB.getUsers();
        const normalUsers = users.filter(u => u.role !== 'admin'); // Không hiện admin
        
        usersTableBody.innerHTML = '';

        for (const user of normalUsers) {
            const todayUsage = await DB.getTodayUsage(user.uid);
            const tr = document.createElement('tr');
            
            // Xử lý createdAt từ Timestamp của Firestore
            let dateStr = 'N/A';
            if (user.createdAt) {
                const date = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
                dateStr = date.toLocaleDateString('vi-VN');
            }

            tr.innerHTML = `
                <td>${user.username}</td>
                <td>${dateStr}</td>
                <td>${todayUsage}</td>
                <td>
                    <input type="number" class="limit-input" value="${user.dailyLimit}" min="0" data-uid="${user.uid}">
                </td>
                <td>
                    <button class="btn btn-primary btn-sm save-limit-btn" data-uid="${user.uid}">Lưu</button>
                </td>
            `;
            usersTableBody.appendChild(tr);
        }

        // Thêm event cho nút Lưu
        document.querySelectorAll('.save-limit-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const uid = e.target.getAttribute('data-uid');
                const input = document.querySelector(`.limit-input[data-uid="${uid}"]`);
                const newLimit = parseInt(input.value);

                if (newLimit >= 0) {
                    e.target.disabled = true;
                    e.target.textContent = 'Đang lưu...';
                    try {
                        await DB.updateUserLimit(uid, newLimit);
                        alert(`Đã cập nhật giới hạn thành ${newLimit} lần/ngày.`);
                    } catch (err) {
                        alert('Có lỗi khi lưu giới hạn');
                        console.error(err);
                    } finally {
                        e.target.disabled = false;
                        e.target.textContent = 'Lưu';
                    }
                } else {
                    alert('Giới hạn không hợp lệ.');
                }
            });
        });
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu admin:', error);
        usersTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red">Lỗi tải dữ liệu</td></tr>';
    }
}
