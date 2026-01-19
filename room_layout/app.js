// グローバル変数
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let state = {
    rooms: [],
    walls: [],
    doors: [],
    windows: [],
    manikins: [],
    selectedTool: 'select',
    selectedItem: null,
    isDragging: false,
    dragStart: null,
    dragOffset: null,
    isResizing: false,
    resizeHandle: null,
    wallThickness: 15,
    gridSize: 50,
    showGrid: true,
    scale: 20 // 1m = 20px
};

// ユーティリティ関数
function snapToGrid(value) {
    return Math.round(value / state.gridSize) * state.gridSize;
}

function calculateTatami(width, height) {
    const sqMeters = (width * height) / (state.scale * state.scale);
    return (sqMeters / 1.62).toFixed(1);
}

function getTotalArea() {
    const total = state.rooms.reduce((sum, room) => {
        const sqMeters = (room.width * room.height) / (state.scale * state.scale);
        return sum + sqMeters;
    }, 0);
    return (total / 1.62).toFixed(1);
}

// 描画関数
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // グリッド描画
    if (state.showGrid) {
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 0.5;
        for (let x = 0; x < canvas.width; x += state.gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += state.gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }

    // 部屋描画
    state.rooms.forEach(room => {
        ctx.fillStyle = room.color || '#e3f2fd';
        ctx.fillRect(room.x, room.y, room.width, room.height);
        
        const isSelected = state.selectedItem?.id === room.id;
        ctx.strokeStyle = isSelected ? '#2196f3' : '#666';
        ctx.lineWidth = isSelected ? 3 : 1;
        ctx.strokeRect(room.x, room.y, room.width, room.height);

        // リサイズハンドル
        if (isSelected) {
            const handleSize = 8;
            ctx.fillStyle = '#2196f3';
            const handles = [
                [room.x, room.y],
                [room.x + room.width, room.y],
                [room.x, room.y + room.height],
                [room.x + room.width, room.y + room.height],
                [room.x + room.width/2, room.y],
                [room.x + room.width/2, room.y + room.height],
                [room.x, room.y + room.height/2],
                [room.x + room.width, room.y + room.height/2]
            ];
            handles.forEach(h => {
                ctx.fillRect(h[0] - handleSize/2, h[1] - handleSize/2, handleSize, handleSize);
            });
        }

        // テキスト
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(room.name || '部屋', room.x + room.width/2, room.y + room.height/2 - 15);
        
        ctx.font = '14px sans-serif';
        const tatami = calculateTatami(room.width, room.height);
        ctx.fillText(tatami + '畳', room.x + room.width/2, room.y + room.height/2 + 5);
        
        if (room.purpose) {
            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#666';
            ctx.fillText(room.purpose, room.x + room.width/2, room.y + room.height/2 + 22);
        }
    });

    // 壁描画
    state.walls.forEach(wall => {
        const isSelected = state.selectedItem?.id === wall.id;
        ctx.strokeStyle = isSelected ? '#2196f3' : '#333';
        ctx.lineWidth = wall.thickness;
        ctx.lineCap = 'square';
        ctx.beginPath();
        ctx.moveTo(wall.x1, wall.y1);
        ctx.lineTo(wall.x2, wall.y2);
        ctx.stroke();
    });

    // ドア描画
    state.doors.forEach(door => {
        const isSelected = state.selectedItem?.id === door.id;
        ctx.save();
        ctx.translate(door.x, door.y);
        ctx.rotate((door.rotation * Math.PI) / 180);

        if (door.doorType === 'swing') {
            ctx.strokeStyle = isSelected ? '#2196f3' : '#8b4513';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(door.width, 0);
            ctx.stroke();
            
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, door.width, 0, Math.PI/2);
            ctx.stroke();
        } else {
            ctx.strokeStyle = isSelected ? '#2196f3' : '#8b4513';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, -5);
            ctx.lineTo(door.width/2, -5);
            ctx.moveTo(door.width/2, 5);
            ctx.lineTo(door.width, 5);
            ctx.stroke();
        }
        ctx.restore();
    });

    // 窓描画
    state.windows.forEach(window => {
        const isSelected = state.selectedItem?.id === window.id;
        ctx.save();
        ctx.translate(window.x, window.y);
        ctx.rotate((window.rotation * Math.PI) / 180);
        
        ctx.strokeStyle = isSelected ? '#2196f3' : '#4fc3f7';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(window.width, 0);
        ctx.stroke();
        
        ctx.strokeStyle = '#b3e5fc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(window.width/2, -4);
        ctx.lineTo(window.width/2, 4);
        ctx.stroke();
        
        ctx.restore();
    });

    // マネキン描画
    state.manikins.forEach(manikin => {
        const isSelected = state.selectedItem?.id === manikin.id;
        ctx.save();
        ctx.translate(manikin.x, manikin.y);
        ctx.rotate((manikin.rotation * Math.PI) / 180);
        
        const size = 20;
        ctx.strokeStyle = isSelected ? '#2196f3' : '#ff5722';
        ctx.fillStyle = '#ffccbc';
        ctx.lineWidth = 2;
        
        // 頭
        ctx.beginPath();
        ctx.arc(0, -size, size/3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // 体
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.7);
        ctx.lineTo(0, size * 0.5);
        ctx.stroke();
        
        // 腕
        ctx.beginPath();
        ctx.moveTo(-size/2, -size * 0.3);
        ctx.lineTo(0, -size * 0.5);
        ctx.lineTo(size/2, -size * 0.3);
        ctx.stroke();
        
        // 脚
        ctx.beginPath();
        ctx.moveTo(0, size * 0.5);
        ctx.lineTo(-size/3, size * 1.2);
        ctx.moveTo(0, size * 0.5);
        ctx.lineTo(size/3, size * 1.2);
        ctx.stroke();
        
        ctx.restore();
    });

    updateUI();
}

// UI更新
function updateUI() {
    document.getElementById('totalArea').textContent = getTotalArea();
    document.getElementById('roomCount').textContent = state.rooms.length;

    if (state.selectedItem) {
        document.getElementById('selectedPanel').style.display = 'block';
        const typeText = {
            'room': '部屋',
            'wall': '壁',
            'door': 'ドア',
            'window': '窓',
            'manikin': '人型'
        };
        document.getElementById('selectedType').innerHTML = '<strong>' + typeText[state.selectedItem.type] + '</strong>';

        let controls = '';
        if (state.selectedItem.type === 'room') {
            controls = `
                <label>部屋名</label>
                <input type="text" id="roomName" value="${state.selectedItem.name || ''}" placeholder="例: リビング">
                <label>用途</label>
                <input type="text" id="roomPurpose" value="${state.selectedItem.purpose || ''}" placeholder="例: 居間">
                <label>幅 (cm)</label>
                <input type="number" id="roomWidth" value="${Math.round(state.selectedItem.width / state.scale * 100)}" min="50">
                <label>高さ (cm)</label>
                <input type="number" id="roomHeight" value="${Math.round(state.selectedItem.height / state.scale * 100)}" min="50">
                <label>色</label>
                <input type="color" id="roomColor" class="color-picker" value="${state.selectedItem.color || '#e3f2fd'}">
            `;
        } else if (state.selectedItem.type === 'door' || state.selectedItem.type === 'window') {
            controls = `
                <label>幅 (cm)</label>
                <input type="number" id="itemWidth" value="${Math.round(state.selectedItem.width / state.scale * 100)}" min="50" max="200">
            `;
        }
        document.getElementById('selectedControls').innerHTML = controls;

        setTimeout(() => {
            const roomName = document.getElementById('roomName');
            if (roomName) {
                roomName.addEventListener('input', (e) => {
                    state.selectedItem.name = e.target.value;
                    draw();
                });
            }
            const roomPurpose = document.getElementById('roomPurpose');
            if (roomPurpose) {
                roomPurpose.addEventListener('input', (e) => {
                    state.selectedItem.purpose = e.target.value;
                    draw();
                });
            }
            const roomWidth = document.getElementById('roomWidth');
            if (roomWidth) {
                roomWidth.addEventListener('input', (e) => {
                    state.selectedItem.width = e.target.value * state.scale / 100;
                    draw();
                });
            }
            const roomHeight = document.getElementById('roomHeight');
            if (roomHeight) {
                roomHeight.addEventListener('input', (e) => {
                    state.selectedItem.height = e.target.value * state.scale / 100;
                    draw();
                });
            }
            const roomColor = document.getElementById('roomColor');
            if (roomColor) {
                roomColor.addEventListener('input', (e) => {
                    state.selectedItem.color = e.target.value;
                    draw();
                });
            }
            const itemWidth = document.getElementById('itemWidth');
            if (itemWidth) {
                itemWidth.addEventListener('input', (e) => {
                    state.selectedItem.width = e.target.value * state.scale / 100;
                    draw();
                });
            }
        }, 0);
    } else {
        document.getElementById('selectedPanel').style.display = 'none';
    }
}

// アイテム検出
function findItemAt(x, y) {
    // リサイズハンドルチェック
    for (let room of [...state.rooms].reverse()) {
        if (state.selectedItem?.id === room.id) {
            const handles = [
                { x: room.x, y: room.y, pos: 'nw' },
                { x: room.x + room.width, y: room.y, pos: 'ne' },
                { x: room.x, y: room.y + room.height, pos: 'sw' },
                { x: room.x + room.width, y: room.y + room.height, pos: 'se' },
                { x: room.x + room.width/2, y: room.y, pos: 'n' },
                { x: room.x + room.width/2, y: room.y + room.height, pos: 's' },
                { x: room.x, y: room.y + room.height/2, pos: 'w' },
                { x: room.x + room.width, y: room.y + room.height/2, pos: 'e' }
            ];
            for (let handle of handles) {
                if (Math.abs(x - handle.x) < 10 && Math.abs(y - handle.y) < 10) {
                    return { type: 'resize', item: room, handle: handle.pos };
                }
            }
        }
    }

    // 部屋
    for (let room of [...state.rooms].reverse()) {
        if (x >= room.x && x <= room.x + room.width &&
            y >= room.y && y <= room.y + room.height) {
            return { type: 'room', ...room };
        }
    }

    // ドア
    for (let door of [...state.doors].reverse()) {
        if (Math.abs(x - door.x) < 50 && Math.abs(y - door.y) < 50) {
            return { type: 'door', ...door };
        }
    }

    // 窓
    for (let window of [...state.windows].reverse()) {
        if (Math.abs(x - window.x) < 50 && Math.abs(y - window.y) < 50) {
            return { type: 'window', ...window };
        }
    }

    // マネキン
    for (let manikin of [...state.manikins].reverse()) {
        if (Math.abs(x - manikin.x) < 30 && Math.abs(y - manikin.y) < 30) {
            return { type: 'manikin', ...manikin };
        }
    }

    return null;
}

// キャンバスイベント
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (state.selectedTool === 'select') {
        const found = findItemAt(x, y);
        if (found && found.type === 'resize') {
            state.isResizing = true;
            state.selectedItem = found.item;
            state.resizeHandle = found.handle;
            state.dragStart = { x, y };
        } else if (found) {
            state.selectedItem = found;
            state.isDragging = true;
            state.dragStart = { x, y };
            state.dragOffset = {
                x: x - found.x,
                y: y - found.y
            };
        } else {
            state.selectedItem = null;
        }
        draw();
    } else {
        const snappedX = snapToGrid(x);
        const snappedY = snapToGrid(y);

        if (state.selectedTool === 'room') {
            state.rooms.push({
                id: Date.now(),
                type: 'room',
                x: snappedX,
                y: snappedY,
                width: 200,
                height: 200,
                name: '部屋' + (state.rooms.length + 1),
                purpose: '',
                color: '#e3f2fd'
            });
        } else if (state.selectedTool === 'wall') {
            state.walls.push({
                id: Date.now(),
                type: 'wall',
                x1: snappedX,
                y1: snappedY,
                x2: snappedX + 100,
                y2: snappedY,
                thickness: state.wallThickness
            });
        } else if (state.selectedTool === 'door-swing') {
            state.doors.push({
                id: Date.now(),
                type: 'door',
                doorType: 'swing',
                x: snappedX,
                y: snappedY,
                width: 80,
                rotation: 0
            });
        } else if (state.selectedTool === 'door-sliding') {
            state.doors.push({
                id: Date.now(),
                type: 'door',
                doorType: 'sliding',
                x: snappedX,
                y: snappedY,
                width: 80,
                rotation: 0
            });
        } else if (state.selectedTool === 'window') {
            state.windows.push({
                id: Date.now(),
                type: 'window',
                x: snappedX,
                y: snappedY,
                width: 100,
                rotation: 0
            });
        } else if (state.selectedTool === 'manikin') {
            state.manikins.push({
                id: Date.now(),
                type: 'manikin',
                x: snappedX,
                y: snappedY,
                rotation: 0
            });
        }
        draw();
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (state.isDragging && state.selectedItem) {
        const newX = snapToGrid(x - state.dragOffset.x);
        const newY = snapToGrid(y - state.dragOffset.y);
        state.selectedItem.x = newX;
        state.selectedItem.y = newY;
        draw();
    } else if (state.isResizing && state.selectedItem) {
        const dx = x - state.dragStart.x;
        const dy = y - state.dragStart.y;
        const room = state.selectedItem;

        if (state.resizeHandle.includes('e')) {
            room.width = Math.max(50, room.width + dx);
        }
        if (state.resizeHandle.includes('w')) {
            const newWidth = Math.max(50, room.width - dx);
            room.x += room.width - newWidth;
            room.width = newWidth;
        }
        if (state.resizeHandle.includes('s')) {
            room.height = Math.max(50, room.height + dy);
        }
        if (state.resizeHandle.includes('n')) {
            const newHeight = Math.max(50, room.height - dy);
            room.y += room.height - newHeight;
            room.height = newHeight;
        }

        state.dragStart = { x, y };
        draw();
    }
});

canvas.addEventListener('mouseup', () => {
    state.isDragging = false;
    state.isResizing = false;
    state.resizeHandle = null;
});

// ツールボタン
document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.selectedTool = btn.dataset.tool;
    });
});

// 設定
document.getElementById('wallThickness').addEventListener('input', (e) => {
    state.wallThickness = parseInt(e.target.value);
});

document.getElementById('gridSize').addEventListener('input', (e) => {
    state.gridSize = parseInt(e.target.value);
    draw();
});

document.getElementById('toggleGrid').addEventListener('click', () => {
    state.showGrid = !state.showGrid;
    document.getElementById('toggleGrid').textContent = 
        '📏 グリッド表示: ' + (state.showGrid ? 'ON' : 'OFF');
    draw();
});

// 選択アイテム操作
document.getElementById('rotateBtn').addEventListener('click', () => {
    if (!state.selectedItem) return;
    
    if (state.selectedItem.type === 'room') {
        const temp = state.selectedItem.width;
        state.selectedItem.width = state.selectedItem.height;
        state.selectedItem.height = temp;
    } else if (state.selectedItem.rotation !== undefined) {
        state.selectedItem.rotation = (state.selectedItem.rotation + 90) % 360;
    }
    draw();
});

document.getElementById('deleteBtn').addEventListener('click', () => {
    if (!state.selectedItem) return;
    
    if (state.selectedItem.type === 'room') {
        state.rooms = state.rooms.filter(r => r.id !== state.selectedItem.id);
    } else if (state.selectedItem.type === 'wall') {
        state.walls = state.walls.filter(w => w.id !== state.selectedItem.id);
    } else if (state.selectedItem.type === 'door') {
        state.doors = state.doors.filter(d => d.id !== state.selectedItem.id);
    } else if (state.selectedItem.type === 'window') {
        state.windows = state.windows.filter(w => w.id !== state.selectedItem.id);
    } else if (state.selectedItem.type === 'manikin') {
        state.manikins = state.manikins.filter(m => m.id !== state.selectedItem.id);
    }
    
    state.selectedItem = null;
    draw();
});

// 保存・読込
document.getElementById('saveBtn').addEventListener('click', () => {
    const data = {
        rooms: state.rooms,
        walls: state.walls,
        doors: state.doors,
        windows: state.windows,
        manikins: state.manikins
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '間取り_' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('loadBtn').addEventListener('click', () => {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            state.rooms = data.rooms || [];
            state.walls = data.walls || [];
            state.doors = data.doors || [];
            state.windows = data.windows || [];
            state.manikins = data.manikins || [];
            state.selectedItem = null;
            draw();
            alert('読み込みが完了しました！');
        } catch (err) {
            alert('ファイルの読み込みに失敗しました');
        }
    };
    reader.readAsText(file);
});

document.getElementById('exportBtn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = '間取り_' + new Date().toISOString().slice(0, 10) + '.png';
    link.href = canvas.toDataURL();
    link.click();
});

document.getElementById('clearBtn').addEventListener('click', () => {
    if (confirm('すべての要素を削除しますか？')) {
        state.rooms = [];
        state.walls = [];
        state.doors = [];
        state.windows = [];
        state.manikins = [];
        state.selectedItem = null;
        draw();
    }
});

// キーボードショートカット
document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' && state.selectedItem) {
        document.getElementById('deleteBtn').click();
    } else if (e.key === 'r' && state.selectedItem) {
        document.getElementById('rotateBtn').click();
    }
});

// 初期描画
draw();
