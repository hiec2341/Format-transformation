document.addEventListener('DOMContentLoaded', () => {
    // 获取所有DOM节点
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const convertBtn = document.getElementById('convertBtn');
    const progressSection = document.getElementById('progressSection');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const resultSection = document.getElementById('resultSection');
    const resultList = document.getElementById('resultList');
    const targetFormatSelect = document.getElementById('targetFormat');
    let selectedFiles = [];

    // 拖拽事件阻止默认行为
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    // 拖拽进入/悬停样式
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('drag-over');
        });
    });

    // 拖拽离开/放下样式
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('drag-over');
        });
    });

    // 拖拽放下文件
    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    // 点击区域选择文件
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // 文件选择框变化
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // 处理选择的文件（格式校验）
    function handleFiles(files) {
        if (files.length === 0) return;
        // 过滤仅支持的格式
        selectedFiles = Array.from(files).filter(file => {
            const isValid = /\.(wav|flac|mp3)$/i.test(file.name);
            if (!isValid) {
                alert(`❌ 文件 ${file.name} 不是支持的格式（仅支持WAV/FLAC/MP3）`);
            }
            return isValid;
        });

        // 更新拖拽区域显示
        if (selectedFiles.length > 0) {
            const fileNames = selectedFiles.map(f => f.name).join('<br>');
            dropZone.innerHTML = `<i>✅</i><h3>已选择 ${selectedFiles.length} 个文件</h3><p style="font-size:0.9rem;">${fileNames}</p>`;
            convertBtn.disabled = false;
        } else {
            dropZone.innerHTML = `<i>🎵</i><h3>点击或拖拽音频文件到此处</h3><p>支持 WAV、FLAC、MP3 格式 | 文件不上传任何服务器</p>`;
            convertBtn.disabled = true;
        }
    }

    // 核心：转换按钮点击事件（真实转换逻辑）
    convertBtn.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;
        // 初始化页面状态
        progressSection.style.display = 'block';
        resultSection.style.display = 'none';
        convertBtn.disabled = true;
        resultList.innerHTML = ''; // 清空历史结果
        progressFill.style.width = '0%';
        progressText.textContent = '初始化转换器...';

        // 实例化音频转换器并初始化
        const converter = new AudioConverter();
        const initSuccess = await converter.init();
        if (!initSuccess) {
            alert('❌ 音频转换器初始化失败，请刷新浏览器重试');
            progressSection.style.display = 'none';
            convertBtn.disabled = false;
            return;
        }

        const targetFormat = targetFormatSelect.value;
        try {
            // 调用真实的批量转换方法（来自audio-converter.js）
            const results = await converter.convertFiles(
                selectedFiles,
                targetFormat,
                (progress, text) => {
                    // 更新进度条和文本
                    progressFill.style.width = `${Math.round(progress * 100)}%`;
                    progressText.textContent = text;
                }
            );

            // 渲染转换结果（成功/失败）
            results.forEach(result => {
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                if (result.success) {
                    // 生成真实音频Blob（二进制数据）
                    const mimeType = result.targetFormat === 'wav' ? 'audio/wav' : 
                                     result.targetFormat === 'flac' ? 'audio/flac' : 'audio/mpeg';
                    const blob = new Blob([result.convertedData], { type: mimeType });
                    const url = URL.createObjectURL(blob);
                    const newFileName = result.originalFile.name.replace(/\.[^/.]+$/, `.${result.targetFormat}`);

                    // 成功项：带下载按钮
                    resultItem.innerHTML = `
                        <div class="file-info">
                            <strong>✅ ${newFileName}</strong><br>
                            <small>原始：${result.originalFile.name}</small>
                        </div>
                        <a href="${url}" download="${newFileName}" class="download-btn">立即下载</a>
                    `;
                    // 释放URL（避免内存泄漏）
                    resultItem.addEventListener('click', () => {
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                    });
                } else {
                    // 失败项：显示错误信息
                    resultItem.style.color = '#ff6b6b';
                    resultItem.innerHTML = `
                        <div class="file-info">
                            <strong>❌ ${result.originalFile.name}</strong><br>
                            <small>错误：${result.error}</small>
                        </div>
                    `;
                }
                resultList.appendChild(resultItem);
            });

            // 转换完成后更新页面
            setTimeout(() => {
                progressSection.style.display = 'none';
                resultSection.style.display = 'block';
                convertBtn.disabled = false;
            }, 800);

        } catch (error) {
            alert(`❌ 转换异常：${error.message}`);
            progressSection.style.display = 'none';
            convertBtn.disabled = false;
        }
    });
});