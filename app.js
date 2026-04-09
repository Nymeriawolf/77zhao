// 退休计划计算器 - 核心逻辑

// 资产配置数据
const assets = {
    cash: { percent: 10, return: 0.02, name: '现金', emoji: '💵', color: '#f59e0b' },
    bond: { percent: 30, return: 0.04, name: '债券', emoji: '📊', color: '#3b82f6' },
    index: { percent: 50, return: 0.08, name: '指数基金', emoji: '📈', color: '#22c55e' },
    gold: { percent: 10, return: 0.05, name: '黄金', emoji: '🥇', color: '#eab308' }
};

// 图表实例
let pieChart = null;
let growthChart = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initTooltips();
    initCharts();
    calculate();
});

// 工具提示功能
function initTooltips() {
    const tooltip = document.getElementById('tooltip');
    const triggers = document.querySelectorAll('.tooltip-trigger');
    
    triggers.forEach(trigger => {
        trigger.addEventListener('mouseenter', (e) => {
            const text = trigger.dataset.tip;
            tooltip.textContent = text;
            tooltip.classList.remove('hidden');
            
            const rect = trigger.getBoundingClientRect();
            tooltip.style.left = rect.left + 'px';
            tooltip.style.top = (rect.bottom + 8) + 'px';
        });
        
        trigger.addEventListener('mouseleave', () => {
            tooltip.classList.add('hidden');
        });
    });
}

// 初始化图表
function initCharts() {
    // 饼图
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    pieChart = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: ['现金', '债券', '指数基金', '黄金'],
            datasets: [{
                data: [10, 30, 50, 10],
                backgroundColor: ['#f59e0b', '#3b82f6', '#22c55e', '#eab308'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true
                    }
                }
            },
            cutout: '60%'
        }
    });

    // 增长曲线图
    const growthCtx = document.getElementById('growthChart').getContext('2d');
    growthChart = new Chart(growthCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: '总资产',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6
                },
                {
                    label: '本金投入',
                    data: [],
                    borderColor: '#94a3b8',
                    backgroundColor: 'rgba(148, 163, 184, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ¥' + formatNumber(context.raw);
                        }
                    }
                },
                annotation: {
                    annotations: {}
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000000) {
                                return '¥' + (value / 10000).toFixed(0) + '万';
                            }
                            return '¥' + formatNumber(value);
                        }
                    }
                }
            }
        }
    });
}

// 更新资产配置
function updateAsset(slider, assetKey, expectedReturn) {
    const value = parseInt(slider.value);
    assets[assetKey].percent = value;
    
    // 更新显示
    const container = slider.closest('.asset-slider');
    container.querySelector('.asset-percent').textContent = value;
    container.querySelector('.asset-bar').style.width = value + '%';
    
    // 更新总计
    updateTotals();
}

// 更新总计
function updateTotals() {
    const total = Object.values(assets).reduce((sum, asset) => sum + asset.percent, 0);
    const totalEl = document.getElementById('totalPercent');
    const warningEl = document.getElementById('totalWarning');
    
    totalEl.textContent = total;
    
    if (total !== 100) {
        totalEl.classList.remove('text-green-600');
        totalEl.classList.add('text-red-500');
        warningEl.classList.remove('hidden');
    } else {
        totalEl.classList.remove('text-red-500');
        totalEl.classList.add('text-green-600');
        warningEl.classList.add('hidden');
    }
    
    // 计算加权收益率
    const weightedReturn = Object.values(assets).reduce((sum, asset) => {
        return sum + (asset.percent / 100) * asset.return;
    }, 0);
    
    document.getElementById('expectedReturn').textContent = (weightedReturn * 100).toFixed(1) + '%';
    
    // 更新饼图
    pieChart.data.datasets[0].data = [
        assets.cash.percent,
        assets.bond.percent,
        assets.index.percent,
        assets.gold.percent
    ];
    pieChart.update();
}

// 设置预设配置
function setPreset(preset) {
    const presets = {
        conservative: { cash: 30, bond: 40, index: 20, gold: 10 },
        balanced: { cash: 10, bond: 30, index: 50, gold: 10 },
        aggressive: { cash: 5, bond: 15, index: 70, gold: 10 }
    };
    
    const config = presets[preset];
    if (!config) return;
    
    // 更新滑块
    Object.keys(config).forEach(key => {
        const slider = document.querySelector(`[data-asset="${key}"] input[type="range"]`);
        if (slider) {
            slider.value = config[key];
            updateAsset(slider, key, assets[key].return * 100);
        }
    });
    
    // 更新按钮状态
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.remove('bg-blue-500', 'text-white');
        btn.classList.add('bg-slate-100', 'text-slate-700');
    });
    event.target.classList.remove('bg-slate-100', 'text-slate-700');
    event.target.classList.add('bg-blue-500', 'text-white');
    
    // 重新计算
    calculate();
}

// 主计算函数
function calculate() {
    // 获取输入值
    const currentAge = parseInt(document.getElementById('currentAge').value) || 30;
    const retireAge = parseInt(document.getElementById('retireAge').value) || 60;
    const initialAmount = parseFloat(document.getElementById('initialAmount').value) || 0;
    const monthlyAmount = parseFloat(document.getElementById('monthlyAmount').value) || 0;
    const monthlyExpense = parseFloat(document.getElementById('monthlyExpense').value) || 5000;
    const lifeExpectancy = parseInt(document.getElementById('lifeExpectancy').value) || 85;
    const retireReturn = parseFloat(document.getElementById('retireReturn').value) / 100 || 0.03;
    const inflationAdjust = document.getElementById('inflationAdjust').checked;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) / 100 || 0.025;
    
    // 计算投资年限
    const years = Math.max(0, retireAge - currentAge);
    
    // 计算加权收益率
    const total = Object.values(assets).reduce((sum, asset) => sum + asset.percent, 0);
    if (total !== 100) {
        alert('请确保投资组合配置总计为100%');
        return;
    }
    
    const annualReturn = Object.values(assets).reduce((sum, asset) => {
        return sum + (asset.percent / 100) * asset.return;
    }, 0);
    
    // 复利计算（退休前积累）
    const result = calculateCompoundInterest(initialAmount, monthlyAmount, annualReturn, years);
    
    // 计算退休后资产消耗
    const retireYears = lifeExpectancy - retireAge;
    const sustainability = calculateRetirementSustainability(
        result.finalAmount, 
        monthlyExpense, 
        retireReturn,
        inflationRate,
        inflationAdjust
    );
    
    // 更新显示
    updateDisplay(result, years, initialAmount, monthlyAmount, annualReturn, 
                   monthlyExpense, retireAge, lifeExpectancy, sustainability, retireReturn);
    
    // 更新增长曲线（包含退休后）
    updateGrowthChartWithRetirement(
        initialAmount, monthlyAmount, annualReturn, years,
        result.finalAmount, monthlyExpense, retireReturn, sustainability.yearsSupported,
        currentAge, retireAge, inflationRate, inflationAdjust
    );
    
    // 计算提前退休分析
    calculateEarlyRetirement(currentAge, initialAmount, monthlyAmount, annualReturn, 
                              monthlyExpense, retireReturn, lifeExpectancy, inflationRate, inflationAdjust);
    
    // 计算最早可退休年龄
    const earliestAge = findEarliestRetireAge(
        currentAge, initialAmount, monthlyAmount, annualReturn,
        monthlyExpense, retireReturn, lifeExpectancy, inflationRate, inflationAdjust
    );
    document.getElementById('earliestRetireAge').textContent = earliestAge + '岁';
    document.getElementById('earliestRetireAge').className = 
        'font-bold ' + (earliestAge <= retireAge ? 'text-green-600' : 'text-red-500');
}

// 复利计算核心函数
function calculateCompoundInterest(principal, monthly, rate, years) {
    const monthlyRate = rate / 12;
    const months = years * 12;
    
    let totalAssets = principal;
    const yearlyData = [principal];
    const principalData = [principal];
    
    let currentPrincipal = principal;
    
    for (let year = 1; year <= years; year++) {
        for (let month = 1; month <= 12; month++) {
            // 本月利息
            const interest = totalAssets * monthlyRate;
            // 添加月投入和利息
            totalAssets += monthly + interest;
            // 累计本金
            currentPrincipal += monthly;
        }
        yearlyData.push(totalAssets);
        principalData.push(currentPrincipal);
    }
    
    const totalPrincipal = principal + monthly * months;
    const totalProfit = totalAssets - totalPrincipal;
    
    return {
        finalAmount: totalAssets,
        totalPrincipal: totalPrincipal,
        totalProfit: totalProfit,
        profitPercent: (totalProfit / totalAssets * 100),
        yearlyData: yearlyData,
        principalData: principalData
    };
}

// 计算退休后资产可持续性
function calculateRetirementSustainability(initialAssets, monthlyExpense, retireReturn, inflationRate, inflationAdjust) {
    let assets = initialAssets;
    const monthlyReturn = retireReturn / 12;
    const monthlyInflation = inflationRate / 12;
    
    let yearsSupported = 0;
    let currentExpense = monthlyExpense;
    const yearlyData = [initialAssets];
    
    // 模拟退休后资产消耗（最多计算50年）
    for (let year = 1; year <= 50; year++) {
        for (let month = 1; month <= 12; month++) {
            // 本月收益
            const monthlyGain = assets * monthlyReturn;
            // 扣除支出（考虑通胀）
            if (inflationAdjust) {
                currentExpense = monthlyExpense * Math.pow(1 + inflationRate, year - 1 + (month - 1) / 12);
            }
            assets = assets + monthlyGain - currentExpense;
            
            // 资产耗尽
            if (assets <= 0) {
                return {
                    yearsSupported: year - 1 + (month - 1) / 12,
                    yearsSupportedRounded: Math.floor(year - 1 + (month - 1) / 12),
                    finalAge: null,
                    yearlyData: yearlyData,
                    depleted: true
                };
            }
        }
        yearsSupported = year;
        yearlyData.push(assets);
    }
    
    return {
        yearsSupported: 50,
        yearsSupportedRounded: 50,
        finalAge: null,
        yearlyData: yearlyData,
        depleted: false
    };
}

// 计算提前退休分析（动态生成）
function calculateEarlyRetirement(currentAge, initialAmount, monthlyAmount, annualReturn, 
                                   monthlyExpense, retireReturn, lifeExpectancy, inflationRate, inflationAdjust) {
    // 获取用户输入的计划退休年龄
    const planRetireAge = parseInt(document.getElementById('retireAge').value) || 60;
    
    // 动态计算分析年龄点：以计划退休年龄为中心，前后各取
    const retireAges = [];
    
    // 向前推算（提前退休）
    for (let age = planRetireAge - 10; age < planRetireAge; age += 5) {
        if (age > currentAge) {
            retireAges.push(age);
        }
    }
    
    // 当前计划
    retireAges.push(planRetireAge);
    
    // 向后推算（延迟退休）
    for (let age = planRetireAge + 5; age <= Math.min(planRetireAge + 15, 75); age += 5) {
        retireAges.push(age);
    }
    
    // 确保至少有5个分析点
    while (retireAges.length < 5) {
        const lastAge = retireAges[retireAges.length - 1] + 5;
        if (lastAge <= 75) {
            retireAges.push(lastAge);
        } else {
            break;
        }
    }
    
    // 动态生成HTML
    const grid = document.getElementById('retireAnalysisGrid');
    grid.innerHTML = '';
    
    retireAges.forEach(age => {
        const years = age - currentAge;
        const isCurrentPlan = (age === planRetireAge);
        
        const card = document.createElement('div');
        card.className = `text-center p-3 rounded-xl transition-all ${isCurrentPlan ? 'bg-blue-50 border-2 border-blue-300 scale-105' : 'bg-slate-50'}`;
        card.id = `card-${age}`;
        
        if (years <= 0) {
            card.innerHTML = `
                <div class="text-sm text-slate-400 mb-1">${age}岁退休</div>
                <div class="text-lg font-bold text-slate-400">已过</div>
                <div class="text-xs mt-1 text-slate-400">--</div>
            `;
            grid.appendChild(card);
            return;
        }
        
        // 计算该年龄退休时的资产
        const result = calculateCompoundInterest(initialAmount, monthlyAmount, annualReturn, years);
        
        // 计算需要的资产（退休后活到预期寿命）
        const retireYears = lifeExpectancy - age;
        const neededAssets = calculateNeededAssets(monthlyExpense, retireReturn, retireYears, inflationRate, inflationAdjust);
        
        const surplus = result.finalAmount - neededAssets;
        const isSufficient = surplus >= 0;
        
        // 根据是否充足设置样式
        if (isCurrentPlan) {
            card.className = card.className.replace('bg-slate-50', '');
        } else {
            card.className = card.className.replace('bg-slate-50', isSufficient ? 'bg-green-50' : 'bg-red-50');
        }
        
        const labelClass = isCurrentPlan ? 'text-blue-600 font-medium' : 'text-slate-500';
        const valueClass = isCurrentPlan ? 'text-blue-600' : (isSufficient ? 'text-green-600' : 'text-red-500');
        const statusClass = isCurrentPlan ? 'text-blue-500' : (isSufficient ? 'text-green-600' : 'text-red-500');
        
        const labelText = isCurrentPlan ? `${age}岁（计划）` : `${age}岁`;
        const statusText = isSufficient 
            ? '✅ 可退休' 
            : '❌ 资金不足';
        const detailText = isSufficient 
            ? `余¥${formatNumberShort(surplus)}` 
            : `缺¥${formatNumberShort(Math.abs(surplus))}`;
        
        card.innerHTML = `
            <div class="text-sm ${labelClass} mb-1">${labelText}</div>
            <div class="text-lg font-bold ${valueClass}">¥${formatNumberShort(result.finalAmount)}</div>
            <div class="text-xs mt-1 ${statusClass}">${statusText}</div>
            <div class="text-xs text-slate-400">${detailText}</div>
        `;
        
        grid.appendChild(card);
    });
}

// 计算需要多少资产才能支撑退休生活
function calculateNeededAssets(monthlyExpense, retireReturn, years, inflationRate, inflationAdjust) {
    // 简化计算：考虑收益和通胀后的总支出
    let totalNeeded = 0;
    let currentExpense = monthlyExpense * 12;
    
    for (let year = 0; year < years; year++) {
        if (inflationAdjust) {
            currentExpense = monthlyExpense * 12 * Math.pow(1 + inflationRate, year);
        }
        // 折现到退休时点
        totalNeeded += currentExpense / Math.pow(1 + retireReturn, year);
    }
    
    return totalNeeded;
}

// 找到最早可退休年龄
function findEarliestRetireAge(currentAge, initialAmount, monthlyAmount, annualReturn,
                                monthlyExpense, retireReturn, lifeExpectancy, inflationRate, inflationAdjust) {
    for (let age = currentAge + 1; age <= 70; age++) {
        const years = age - currentAge;
        const result = calculateCompoundInterest(initialAmount, monthlyAmount, annualReturn, years);
        const retireYears = lifeExpectancy - age;
        const neededAssets = calculateNeededAssets(monthlyExpense, retireReturn, retireYears, inflationRate, inflationAdjust);
        
        if (result.finalAmount >= neededAssets) {
            return age;
        }
    }
    return 70; // 如果70岁前都不够，返回70
}

// 更新显示
function updateDisplay(result, years, initial, monthly, annualReturn, 
                        monthlyExpense, retireAge, lifeExpectancy, sustainability, retireReturn) {
    // 更新主结果卡片
    document.getElementById('resultAmount').textContent = '¥' + formatNumber(result.finalAmount);
    document.getElementById('resultYears').textContent = `投资 ${years} 年 · 年化 ${(annualReturn * 100).toFixed(1)}%`;
    document.getElementById('totalPrincipal').textContent = '¥' + formatNumber(result.totalPrincipal);
    document.getElementById('totalProfit').textContent = '¥' + formatNumber(result.totalProfit);
    document.getElementById('profitPercent').textContent = result.profitPercent.toFixed(1) + '%';
    
    // 更新支出显示
    document.getElementById('monthlyExpenseDisplay').textContent = '¥' + formatNumber(monthlyExpense);
    
    // 更新支撑分析
    const supportAge = retireAge + Math.floor(sustainability.yearsSupported);
    document.getElementById('supportAge').textContent = supportAge + '岁';
    document.getElementById('supportYears').textContent = sustainability.yearsSupported.toFixed(1) + '年';
    
    // 根据是否足够改变颜色
    const supportAgeEl = document.getElementById('supportAge');
    if (supportAge >= lifeExpectancy) {
        supportAgeEl.className = 'font-bold text-green-600';
        supportAgeEl.textContent = supportAge + '岁 ✅';
    } else {
        supportAgeEl.className = 'font-bold text-red-500';
        supportAgeEl.textContent = supportAge + '岁 ⚠️';
    }
    
    // 更新结论卡片
    updateConclusionCard(result.finalAmount, monthlyExpense, retireAge, lifeExpectancy, 
                          sustainability, retireReturn);
    
    // 添加动画
    document.getElementById('resultAmount').classList.add('result-animate');
    setTimeout(() => {
        document.getElementById('resultAmount').classList.remove('result-animate');
    }, 500);
}

// 更新结论卡片
function updateConclusionCard(assets, monthlyExpense, retireAge, lifeExpectancy, sustainability, retireReturn) {
    const conclusionCard = document.getElementById('conclusionCard');
    const conclusionStatus = document.getElementById('conclusionStatus');
    const conclusionDetail = document.getElementById('conclusionDetail');
    
    const retireYears = lifeExpectancy - retireAge;
    const neededAssets = calculateNeededAssets(monthlyExpense, retireReturn, retireYears, 0.025, true);
    const surplus = assets - neededAssets;
    
    if (surplus >= 0) {
        conclusionCard.className = 'bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white';
        conclusionStatus.textContent = '✅ 可以按计划退休';
        conclusionDetail.innerHTML = `
            <p>您的资产可以支撑到 <strong>${retireAge + Math.floor(sustainability.yearsSupported)}</strong> 岁</p>
            <p>相比预期寿命 <strong>${lifeExpectancy}</strong> 岁，资产充裕</p>
            <p>预计结余：<strong>¥${formatNumber(surplus)}</strong></p>
        `;
    } else {
        conclusionCard.className = 'bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shadow-lg p-6 text-white';
        conclusionStatus.textContent = '⚠️ 资产可能不足';
        conclusionDetail.innerHTML = `
            <p>您的资产预计支撑到 <strong>${retireAge + Math.floor(sustainability.yearsSupported)}</strong> 岁</p>
            <p>距离预期寿命 <strong>${lifeExpectancy}</strong> 岁还有 <strong>${lifeExpectancy - retireAge - Math.floor(sustainability.yearsSupported)}</strong> 年缺口</p>
            <p>建议：增加月投资额或延迟退休年龄</p>
        `;
    }
}

// 更新增长曲线图（包含退休后）
function updateGrowthChartWithRetirement(principal, monthly, rate, workYears,
                                          retireAssets, monthlyExpense, retireReturn, retireYearsSupported,
                                          currentAge, retireAge, inflationRate, inflationAdjust) {
    const labels = [];
    const assetData = [];
    const principalData = [];
    
    // 工作期间
    let totalAssets = principal;
    let totalPrincipal = principal;
    const monthlyRate = rate / 12;
    
    labels.push(currentAge + '岁');
    assetData.push(principal);
    principalData.push(principal);
    
    for (let year = 1; year <= workYears; year++) {
        labels.push((currentAge + year) + '岁');
        
        for (let month = 1; month <= 12; month++) {
            const interest = totalAssets * monthlyRate;
            totalAssets += monthly + interest;
            totalPrincipal += monthly;
        }
        
        assetData.push(totalAssets);
        principalData.push(totalPrincipal);
    }
    
    // 退休期间
    const retireMonthlyRate = retireReturn / 12;
    let retireAssets_current = totalAssets;
    let currentExpense = monthlyExpense;
    
    // 计算退休后的资产变化（最多显示到支撑年限+5年或50年）
    const maxRetireYears = Math.min(Math.ceil(retireYearsSupported) + 5, 50);
    
    for (let year = 1; year <= maxRetireYears; year++) {
        labels.push((retireAge + year) + '岁');
        
        for (let month = 1; month <= 12; month++) {
            const monthlyGain = retireAssets_current * retireMonthlyRate;
            if (inflationAdjust) {
                currentExpense = monthlyExpense * Math.pow(1 + inflationRate, year - 1 + (month - 1) / 12);
            }
            retireAssets_current = retireAssets_current + monthlyGain - currentExpense;
            
            if (retireAssets_current <= 0) {
                retireAssets_current = 0;
                break;
            }
        }
        
        assetData.push(Math.max(0, retireAssets_current));
        principalData.push(totalPrincipal); // 本金线保持不变
        
        if (retireAssets_current <= 0) break;
    }
    
    growthChart.data.labels = labels;
    growthChart.data.datasets[0].data = assetData;
    growthChart.data.datasets[1].data = principalData;
    
    // 添加退休分界线标记
    const retireIndex = workYears;
    
    growthChart.update();
}

// 格式化数字
function formatNumber(num) {
    if (num >= 100000000) {
        return (num / 100000000).toFixed(2) + '亿';
    } else if (num >= 10000) {
        return (num / 10000).toFixed(2) + '万';
    } else {
        return num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
}

// 格式化数字（简短版，用于卡片显示）
function formatNumberShort(num) {
    if (num >= 100000000) {
        return (num / 100000000).toFixed(1) + '亿';
    } else if (num >= 10000) {
        return (num / 10000).toFixed(1) + '万';
    } else {
        return num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
}

// 实时计算（输入变化时自动更新）
document.querySelectorAll('input[type="number"], input[type="checkbox"], select').forEach(input => {
    input.addEventListener('input', debounce(calculate, 300));
    input.addEventListener('change', calculate);
});

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
