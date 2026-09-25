/**
 * 1950년 6월: 그날의 선택 — 6·25 전쟁과 평화 아카이브
 * 인터랙티브 역사 다큐멘터리 체험 로직
 */

(() => {
  'use strict';

  // ==========================================================================
  // 1. 상태 관리 (State)
  // ==========================================================================
  const gameState = {
    currentStep: 'intro', // 'intro' | 'stage1' | 'stage2' | 'stage3' | 'stage4'
    student: {
      schoolClass: '평화초등학교 6학년',
      name: '김평화'
    },
    unlockedClues: new Set([1]), // 단서 1번은 기본 개방
    stage1: {
      selectedItem: null,
      helpedTargets: new Set(),
      radioTuned: false,
      isDoorUnlocked: false
    },
    stage2: {
      selectedTile: null,
      placedTiles: new Set(),
      isRebuilt: false
    },
    stage3: {
      selectedJob: null
    },
    stage4: {
      selectedPledges: [],
      customPledge: '',
      certGenerated: false
    },
    soundEnabled: true,
    timerSeconds: 0,
    timerInterval: null
  };

  // 4대 역사적 역할 데이터 (고증 바탕 역사 다큐멘터리)
  const JOB_DATA = {
    soldier: {
      name: '국군 장병',
      badge: '평화 수호 부문 (호국 영웅)',
      role: '전선을 수호하고 피란민의 귀환을 도운 평화의 방파제',
      story: `
        “포성이 멎은 1953년 7월, 우리는 다시는 사랑하는 가족과 형제들을 잃지 않도록 밤낮으로 철책을 지켰습니다.<br>
        폭파된 한강 다리와 도로를 임시로 잇고, 지뢰를 제거하여 피란민들이 고향 땅을 다시 밟을 수 있도록 온몸을 바쳤습니다.<br>
        전쟁으로 부모를 잃은 어린 고아들을 부대로 데려와 따뜻한 주먹밥을 먹이고, 미래를 향한 희망을 함께 품었습니다.”
      `,
      lesson: '평화는 값없이 주어지는 것이 아니며, 안전한 일상을 든든하게 지켜낸 헌신과 희생이 있었기에 오늘날 우리가 자유롭게 꿈꿀 수 있습니다.'
    },
    shoeshine: {
      name: '구두닦이 소년',
      badge: '청소년 자립 부문 (불굴의 희망)',
      role: '무거운 구두통을 메고 가족을 지켜낸 소년 가장',
      story: `
        “전쟁 통에 부모님을 잃고 어린 동생 둘을 데리고 부산 역전으로 내려왔습니다.<br>
        제 몸집만 한 무거운 구두통을 메고 하루 종일 뛰어다니며 어른들의 군화를 닦았지요.<br>
        손은 새까만 약으로 물들고 발은 부르텄지만, 번 푼돈으로 주먹밥을 사서 더 어린 동생들의 입에 넣어주었습니다.<br>
        ‘오늘을 버티면 반드시 밝은 내일이 온다’는 믿음 하나로 끝내 포기하지 않았습니다.”
      `,
      lesson: '아무리 가혹한 시련 앞에서도 좌절하지 않고, 나보다 더 힘든 이웃을 돌보는 따뜻한 연대가 진정한 삶의 평화를 일굽니다.'
    },
    merchant: {
      name: '국제시장 상인',
      badge: '공동체 회복 부문 (서민 경제의 심장)',
      role: '잿더미 위에서 장터를 열고 서민의 생계를 지킨 어머니·아버지',
      story: `
        “모든 것이 불타버린 부산 국제시장 골목에 사과 궤짝을 놓고 미군 보급 물품과 남새를 팔기 시작했습니다.<br>
        돈이 없는 피란민에게는 덤으로 보리쌀 한 됫박을 더 쥐여주었고, 굶주린 아이들에게는 따끈한 국수를 말아주었습니다.<br>
        서로의 눈물을 닦아주며 장사를 돕다 보니, 잿더미였던 시장은 활기를 되찾고 대한민국 경제를 다시 뛰게 한 심장이 되었습니다.”
      `,
      lesson: '공동체의 아픔을 함께 짊어지고 서로의 손을 맞잡아준 상인들의 끈질긴 생명력이 무너진 나라를 다시 일으켜 세웠습니다.'
    },
    teacher: {
      name: '천막학교 교사',
      badge: '교육 및 평화 부문 (미래의 등불)',
      role: '포탄 상자를 책상 삼아 배움의 불씨를 지킨 참스승',
      story: `
        “교실도 책상도 다 잃었지만, 군용 천막을 빌려 흙바닥 위에 작은 학교를 세웠습니다.<br>
        시멘트 포대 종이에 글을 썼고, 나뭇가지로 마당 흙에 한글 자모를 쓰며 아이들을 가르쳤습니다.<br>
        ‘포탄은 건물을 무너뜨릴 수 있어도, 너희의 가슴속 꿈은 결코 부술 수 없단다.’<br>
        배움을 갈망하던 아이들의 초롱초롱한 눈망울에서 평화로운 미래 대한민국의 희망을 보았습니다.”
      `,
      lesson: '어떠한 절망 속에서도 중단되지 않았던 교육에 대한 열정과 다음 세대를 향한 사랑이 오늘날 번영한 대한민국의 뿌리가 되었습니다.'
    }
  };

  // 단계별 날짜 태그 및 부제 데이터 (화면 상단 Dossier Subbar 갱신용)
  const STAGE_META = {
    intro: {
      date: '1950년 6월 25일 — 서울',
      subtitle: '프롤로그: 평범했던 어느 날'
    },
    stage1: {
      date: '1951년 1월 4일 — 부산 피란민 마을',
      subtitle: '제1구역: 혹한 속 생존과 연결'
    },
    stage2: {
      date: '1952년 8월 15일 — 재건 광장과 국제시장',
      subtitle: '제2구역: 잿더미를 딛고 일어선 일상'
    },
    stage3: {
      date: '1953년 7월 27일 — 판문점 휴전 협정',
      subtitle: '제3구역: 내가 걸어갈 역사의 길'
    },
    stage4: {
      date: '2026년 오늘날 — 평화의 약속',
      subtitle: '에필로그: 기억을 딛고 평화를 꽃피우다'
    }
  };

  // ==========================================================================
  // 2. Web Audio API 신시사이저 (역사 효과음)
  // ==========================================================================
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // 문서 셔터 및 버튼 클릭음
  function playClickSound() {
    if (!gameState.soundEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, audioCtx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.06);
    } catch (e) {}
  }

  // 성공 및 미션 완수 화음 (차분한 클래식 아르페지오)
  function playSuccessSound() {
    if (!gameState.soundEnabled || !audioCtx) return;
    try {
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0, audioCtx.currentTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.08);
        osc.stop(audioCtx.currentTime + idx * 0.08 + 0.35);
      });
    } catch (e) {}
  }

  // 붉은 인장 도장 날인음 (쿵- 소리)
  function playStampSound() {
    if (!gameState.soundEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(35, audioCtx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.28);
    } catch (e) {}
  }

  // 라디오 주파수 조율 차임음
  function playRadioChime() {
    if (!gameState.soundEnabled || !audioCtx) return;
    try {
      const notes = [587.33, 739.99, 880, 1174.66]; // D5, F#5, A5, D6
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.14, audioCtx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.1 + 0.45);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.1);
        osc.stop(audioCtx.currentTime + idx * 0.1 + 0.45);
      });
    } catch (e) {}
  }

  // 통행 허가 딸깍 해제음
  function playUnlockSound() {
    if (!gameState.soundEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(260, audioCtx.currentTime);
      osc.frequency.setValueAtTime(520, audioCtx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.18);
    } catch (e) {}
  }

  // ==========================================================================
  // 3. UI 네비게이션 & 진행 단계 제어
  // ==========================================================================
  const screens = {
    intro: document.getElementById('screenIntro'),
    stage1: document.getElementById('screenStage1'),
    stage2: document.getElementById('screenStage2'),
    stage3: document.getElementById('screenStage3'),
    stage4: document.getElementById('screenStage4')
  };

  const navStepNodes = {
    intro: document.getElementById('navStepIntro'),
    stage1: document.getElementById('navStepStage1'),
    stage2: document.getElementById('navStepStage2'),
    stage3: document.getElementById('navStepStage3'),
    stage4: document.getElementById('navStepStage4')
  };

  const dossierDateTag = document.getElementById('dossierDateTag');
  const dossierSubtitle = document.getElementById('dossierSubtitle');
  const playTimer = document.getElementById('playTimer');
  const clueBadge = document.getElementById('clueBadge');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');
  const soundLabel = document.getElementById('soundLabel');

  function updateStepNav(targetStep) {
    gameState.currentStep = targetStep;
    const stepOrder = ['intro', 'stage1', 'stage2', 'stage3', 'stage4'];
    const activeIdx = stepOrder.indexOf(targetStep);

    // 상단 스텝 노드 상태 변경
    stepOrder.forEach((stepKey, idx) => {
      const node = navStepNodes[stepKey];
      if (!node) return;
      node.classList.remove('active', 'completed');
      if (idx < activeIdx) {
        node.classList.add('completed');
      } else if (idx === activeIdx) {
        node.classList.add('active');
      }
    });

    // 화면 상단 Dossier 서브바 텍스트 갱신
    if (STAGE_META[targetStep]) {
      dossierDateTag.textContent = STAGE_META[targetStep].date;
      dossierSubtitle.textContent = STAGE_META[targetStep].subtitle;
    }

    // 화면 전환
    Object.keys(screens).forEach(key => {
      if (key === targetStep) {
        screens[key].classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        screens[key].classList.remove('active');
      }
    });

    // 단계 진입 시 단서 해금 확인
    if (targetStep === 'stage1') unlockClue(2);
    if (targetStep === 'stage2') unlockClue(3);
    if (targetStep === 'stage3') unlockClue(4);

    // 셔플 로직 적용
    if (targetStep === 'stage1' && gameState.stage1.helpedTargets.size === 0) {
      shuffleReliefElements();
    } else if (targetStep === 'stage2' && gameState.stage2.placedTiles.size === 0) {
      shuffleTiles();
    }
  }

  // 단서 해금 처리
  function unlockClue(clueNum) {
    gameState.unlockedClues.add(clueNum);
    clueBadge.textContent = `${gameState.unlockedClues.size}/4`;

    const clueCard = document.getElementById(`clueCard${clueNum}`);
    const clueStatus = document.getElementById(`clueStatus${clueNum}`);
    if (clueCard && clueStatus) {
      clueCard.classList.add('unlocked');
      clueStatus.textContent = `기록 0${clueNum} (확보 완료)`;
    }
  }

  // 타이머 가동
  function startTimer() {
    if (gameState.timerInterval) return;
    gameState.timerInterval = setInterval(() => {
      gameState.timerSeconds++;
      const mins = String(Math.floor(gameState.timerSeconds / 60)).padStart(2, '0');
      const secs = String(gameState.timerSeconds % 60).padStart(2, '0');
      playTimer.textContent = `기록 ${mins}:${secs}`;
    }, 1000);
  }

  // 음향 온/오프
  soundToggleBtn.addEventListener('click', () => {
    initAudio();
    gameState.soundEnabled = !gameState.soundEnabled;
    if (gameState.soundEnabled) {
      soundIcon.textContent = '📢';
      soundLabel.textContent = '소리 켬';
      playClickSound();
    } else {
      soundIcon.textContent = '🔇';
      soundLabel.textContent = '소리 끔';
    }
  });

  // 단서 수첩 모달 제어
  const clueNotebookBtn = document.getElementById('clueNotebookBtn');
  const clueModal = document.getElementById('clueModal');
  const closeClueModalBtn = document.getElementById('closeClueModalBtn');
  const closeClueModalBtn2 = document.getElementById('closeClueModalBtn2');

  function openClueModal() {
    initAudio();
    playClickSound();
    clueModal.style.display = 'flex';
  }

  function closeClueModal() {
    initAudio();
    playClickSound();
    clueModal.style.display = 'none';
  }

  clueNotebookBtn.addEventListener('click', openClueModal);
  closeClueModalBtn.addEventListener('click', closeClueModal);
  closeClueModalBtn2.addEventListener('click', closeClueModal);
  clueModal.addEventListener('click', (e) => {
    if (e.target === clueModal) closeClueModal();
  });

  // ==========================================================================
  // 4. 인트로 화면: 탐구자 등록 & 시작
  // ==========================================================================
  const studentForm = document.getElementById('studentForm');
  const schoolClassInput = document.getElementById('schoolClass');
  const studentNameInput = document.getElementById('studentName');

  studentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    initAudio();
    playSuccessSound();

    const school = schoolClassInput.value.trim() || '평화초등학교 6학년';
    const name = studentNameInput.value.trim() || '역사 탐구자';

    gameState.student.schoolClass = school;
    gameState.student.name = name;

    startTimer();
    updateStepNav('stage1');
  });

  // ==========================================================================
  // 5. 1단계: 생존 (구호물자 배급 & 진공관 비상 라디오)
  // ==========================================================================
  const itemCards = document.querySelectorAll('.item-card');
  const neighborCards = document.querySelectorAll('.neighbor-card');
  const reliefStatus = document.getElementById('reliefStatus');

  const MATCHING_PAIRS = {
    blanket: 'baby',     // 솜 누비이불 -> 갓난아이 품은 어머니
    food: 'hungry',      // 전시 비상 식량 -> 동생 지키는 소년
    medicine: 'elder'    // 응급 구호 의약품 -> 피란길 부상 노인
  };

  const NEIGHBOR_THANKS = {
    baby: '"눈보라를 막아줄 따뜻한 이불 덕분에 아기가 평온하게 숨을 쉽니다. 깊이 감사드립니다."',
    hungry: '"며칠 동안 굶주렸던 동생의 얼굴에 비로소 생기가 돕니다. 평생 잊지 않겠습니다."',
    elder: '"파편 상처를 소독하고 싸매니 이제야 살 것 같소. 이 고마운 은혜를 어찌 갚으리."'
  };

  function shuffleReliefElements() {
    const itemsRow = document.querySelector('.relief-items-row');
    const neighborsRow = document.querySelector('.neighbors-row');
    if (!itemsRow || !neighborsRow) return;

    let items = Array.from(itemsRow.children);
    let neighbors = Array.from(neighborsRow.children);

    function shuffleArr(arr) {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    let attempts = 0;
    while (attempts < 25) {
      items = shuffleArr(items);
      neighbors = shuffleArr(neighbors);
      
      const hasParallelMatch = items.some((item, idx) => {
        const itemType = item.getAttribute('data-item');
        const targetType = neighbors[idx].getAttribute('data-target');
        return MATCHING_PAIRS[itemType] === targetType;
      });

      if (!hasParallelMatch) break;
      attempts++;
    }

    items.forEach(el => itemsRow.appendChild(el));
    neighbors.forEach(el => neighborsRow.appendChild(el));
  }

  function shuffleTiles() {
    const tilesPool = document.getElementById('tilesPool');
    if (!tilesPool) return;
    let tiles = Array.from(tilesPool.children);
    const slotOrder = ['cooperation', 'sharing', 'peace'];

    function shuffleArr(arr) {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    let attempts = 0;
    while (attempts < 25) {
      tiles = shuffleArr(tiles);
      const hasParallelMatch = tiles.some((tile, idx) => {
        return tile.getAttribute('data-value') === slotOrder[idx];
      });
      if (!hasParallelMatch) break;
      attempts++;
    }
    tiles.forEach(el => tilesPool.appendChild(el));
  }

  // 초기 셔플 1회 실행
  shuffleReliefElements();
  shuffleTiles();
  unlockClue(1);

  itemCards.forEach(card => {
    card.addEventListener('click', () => {
      initAudio();
      if (card.classList.contains('used')) return;
      playClickSound();

      itemCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      gameState.stage1.selectedItem = card.getAttribute('data-item');
    });
  });

  neighborCards.forEach(card => {
    card.addEventListener('click', () => {
      initAudio();
      const targetId = card.getAttribute('data-target');
      if (gameState.stage1.helpedTargets.has(targetId)) return;

      if (!gameState.stage1.selectedItem) {
        alert('먼저 상단에서 전달할 [전시 구호물자]를 선택해 주십시오.');
        return;
      }

      // 일치 검사
      if (MATCHING_PAIRS[gameState.stage1.selectedItem] === targetId) {
        playSuccessSound();
        gameState.stage1.helpedTargets.add(targetId);

        const usedItemCard = document.getElementById(`item-${gameState.stage1.selectedItem}`);
        usedItemCard.classList.remove('selected');
        usedItemCard.classList.add('used');
        usedItemCard.disabled = true;

        card.classList.add('helped');
        card.querySelector('.target-speech').textContent = NEIGHBOR_THANKS[targetId];
        card.querySelector('.target-state').textContent = '지원 완료 (온기 전달)';

        gameState.stage1.selectedItem = null;

        reliefStatus.textContent = `${gameState.stage1.helpedTargets.size} / 3 완료`;
        if (gameState.stage1.helpedTargets.size === 3) {
          reliefStatus.textContent = '3 / 3 배급 완료';
          reliefStatus.classList.add('done');
          checkStage1Completion();
        }
      } else {
        playClickSound();
        alert('이 이웃에게는 다른 구호물자가 더욱 절박해 보입니다. 물자의 용도를 다시 검토해 보십시오.');
      }
    });
  });

  // (2) 라디오 주파수 조절
  const freqSlider = document.getElementById('freqSlider');
  const freqNeedle = document.getElementById('freqNeedle');
  const currentFreq = document.getElementById('currentFreq');
  const radioLed = document.getElementById('radioLed');
  const radioBroadcastText = document.getElementById('radioBroadcastText');
  const radioMessageBox = document.getElementById('radioMessageBox');
  const radioStatus = document.getElementById('radioStatus');

  freqSlider.addEventListener('input', (e) => {
    initAudio();
    const val = parseFloat(e.target.value);
    const percent = ((val - 160) / (230 - 160)) * 100;
    freqNeedle.style.left = `${percent}%`;
    currentFreq.innerHTML = `현재 수신 주파수: <strong>${val.toFixed(1)} MHz</strong>`;

    // 정답 주파수: 195.3 MHz
    if (Math.abs(val - 195.3) <= 0.6) {
      if (!gameState.stage1.radioTuned) {
        gameState.stage1.radioTuned = true;
        playRadioChime();
        radioLed.classList.add('tuned');
        radioMessageBox.classList.add('broadcast-active');
        radioStatus.textContent = '평화 방송 수신 완료';
        radioStatus.classList.add('done');
        radioBroadcastText.innerHTML = `
          <strong>📢 [1953년 7월 긴급 평화 방송 전문]</strong><br>
          “지지직... 국민 여러분, 3년 1개월간 계속되었던 포성이 마침내 멎었습니다!<br>
          비록 모든 것이 부서졌지만 서로의 손을 맞잡고 폐허 위에 다시 평화로운 일상을 세웁시다!”
        `;
        checkStage1Completion();
      }
    } else {
      if (!gameState.stage1.radioTuned) {
        radioLed.classList.remove('tuned');
        radioMessageBox.classList.remove('broadcast-active');
        if (Math.abs(val - 195.3) <= 4.0) {
          radioBroadcastText.textContent = '치지직... "...국민... 여러분... 평화..." 전파 신호가 잡힐 듯합니다. 미세하게 조절하십시오.';
        } else {
          radioBroadcastText.textContent = '치지직... 삐익... 전파 잡음만 들립니다. 주파수를 195.3 MHz 부근으로 맞추십시오.';
        }
      }
    }
  });

  // 1단계 통행 통제 해제
  const doorCard = document.getElementById('doorCard');
  const doorIcon = document.getElementById('doorIcon');
  const doorTitle = document.getElementById('doorTitle');
  const doorSub = document.getElementById('doorSub');
  const stage1NextBtn = document.getElementById('stage1NextBtn');

  function checkStage1Completion() {
    if (gameState.stage1.helpedTargets.size === 3 && gameState.stage1.radioTuned) {
      if (!gameState.stage1.isDoorUnlocked) {
        gameState.stage1.isDoorUnlocked = true;
        playUnlockSound();
        doorIcon.textContent = '통행 허가';
        doorTitle.textContent = '재건 구역 통행 허가 획득';
        doorSub.textContent = '구호 물자 나눔과 평화 소식 수신이 확인되었습니다. 아래 버튼을 눌러 재건의 현장으로 이동하십시오.';
        doorCard.classList.add('unlocked');
        stage1NextBtn.disabled = false;
      }
    }
  }

  stage1NextBtn.addEventListener('click', () => {
    initAudio();
    playSuccessSound();
    updateStepNav('stage2');
  });

  // ==========================================================================
  // 6. 2단계: 생계 (마을 광장 재건 가치 패 맞추기)
  // ==========================================================================
  const valueTiles = document.querySelectorAll('.value-tile');
  const boardSlots = document.querySelectorAll('.board-slot');
  const rebuildBanner = document.getElementById('rebuildBanner');
  const stage2NextBtn = document.getElementById('stage2NextBtn');

  valueTiles.forEach(tile => {
    tile.addEventListener('click', () => {
      initAudio();
      if (tile.classList.contains('placed')) return;
      playClickSound();

      valueTiles.forEach(t => t.classList.remove('selected'));
      tile.classList.add('selected');
      gameState.stage2.selectedTile = tile.getAttribute('data-value');
    });

    tile.addEventListener('dragstart', (e) => {
      gameState.stage2.selectedTile = tile.getAttribute('data-value');
      e.dataTransfer.setData('text/plain', tile.getAttribute('data-value'));
    });
  });

  boardSlots.forEach(slot => {
    slot.addEventListener('click', () => {
      initAudio();
      const acceptVal = slot.getAttribute('data-accept');
      if (slot.classList.contains('filled')) return;

      if (!gameState.stage2.selectedTile) {
        alert('먼저 왼쪽에서 배치할 [핵심 가치 패]를 선택해 주십시오.');
        return;
      }

      if (gameState.stage2.selectedTile === acceptVal) {
        placeTileInSlot(gameState.stage2.selectedTile, slot);
      } else {
        playClickSound();
        alert('이 조항의 취지와 어울리는 다른 가치 패를 선택해 주십시오.');
      }
    });

    slot.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    slot.addEventListener('drop', (e) => {
      e.preventDefault();
      const droppedVal = e.dataTransfer.getData('text/plain') || gameState.stage2.selectedTile;
      const acceptVal = slot.getAttribute('data-accept');
      if (droppedVal === acceptVal && !slot.classList.contains('filled')) {
        placeTileInSlot(droppedVal, slot);
      }
    });
  });

  function placeTileInSlot(val, slotElement) {
    playSuccessSound();
    gameState.stage2.placedTiles.add(val);

    const matchedTile = document.getElementById(`tile-${val}`);
    matchedTile.classList.remove('selected');
    matchedTile.classList.add('placed');

    slotElement.classList.add('filled');
    const tileTitle = matchedTile.querySelector('.tile-title').textContent;
    const tileSub = matchedTile.querySelector('.tile-sub').textContent;

    slotElement.innerHTML = `
      <div style="display: flex; align-items: center; gap: 14px;">
        <span style="border: 1.5px solid var(--archive-green); color: var(--archive-green); padding: 3px 8px; border-radius: 3px; font-weight: 800; font-size: 0.8rem; font-family: var(--font-serif);">결의 비준</span>
        <div>
          <strong style="color: var(--archive-green); font-size: 1.05rem; font-family: var(--font-serif);">${tileTitle}</strong>
          <p style="color: var(--ink-secondary); font-size: 0.85rem; margin-top: 2px;">${tileSub} — 마을 공동체 결의가 확립되었습니다.</p>
        </div>
      </div>
    `;

    gameState.stage2.selectedTile = null;

    if (gameState.stage2.placedTiles.size === 3) {
      gameState.stage2.isRebuilt = true;
      rebuildBanner.classList.add('active');
      stage2NextBtn.disabled = false;
    }
  }

  stage2NextBtn.addEventListener('click', () => {
    initAudio();
    playSuccessSound();
    updateStepNav('stage3');
  });

  // ==========================================================================
  // 7. 3단계: 휴전 (1953년 7월, 역사가 된 4인의 선택)
  // ==========================================================================
  const jobCards = document.querySelectorAll('.job-card');
  const jobDetailBox = document.getElementById('jobDetailBox');
  const detailTitle = document.getElementById('detailTitle');
  const detailRole = document.getElementById('detailRole');
  const detailStory = document.getElementById('detailStory');
  const detailLesson = document.getElementById('detailLesson');
  const stage3NextBtn = document.getElementById('stage3NextBtn');

  jobCards.forEach(card => {
    card.addEventListener('click', () => {
      initAudio();
      playClickSound();
      const jobKey = card.getAttribute('data-job');
      gameState.stage3.selectedJob = jobKey;

      jobCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      const data = JOB_DATA[jobKey];
      detailTitle.textContent = `${data.name}의 역사적 발자취`;
      detailRole.textContent = data.role;
      detailStory.innerHTML = data.story;
      detailLesson.textContent = data.lesson;

      jobDetailBox.style.display = 'block';
      jobDetailBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });

  stage3NextBtn.addEventListener('click', () => {
    initAudio();
    playSuccessSound();
    updateStepNav('stage4');
  });

  // ==========================================================================
  // 8. 4단계: 결말 (오늘날 나의 평화 서약 & 공식 임명장)
  // ==========================================================================
  const customPledgeInput = document.getElementById('customPledgeText');
  const pledgeCharCount = document.getElementById('pledgeCharCount');
  const presetBadges = document.querySelectorAll('.badge-btn');
  const makeCertBtn = document.getElementById('makeCertBtn');
  const certificateArea = document.getElementById('certificateArea');

  function updateCharCount() {
    if (customPledgeInput && pledgeCharCount) {
      pledgeCharCount.textContent = `${customPledgeInput.value.length} / 120자`;
    }
  }

  if (customPledgeInput) {
    customPledgeInput.addEventListener('input', updateCharCount);
  }

  presetBadges.forEach(btn => {
    btn.addEventListener('click', () => {
      initAudio();
      playClickSound();
      customPledgeInput.value = btn.getAttribute('data-preset');
      updateCharCount();
      customPledgeInput.focus();
    });
  });

  makeCertBtn.addEventListener('click', () => {
    initAudio();
    const customText = customPledgeInput.value.trim();
    if (!customText) {
      alert('나만의 평화 실천 서약문을 작성해 주십시오. (아래 추천 양식을 누르셔도 좋습니다.)');
      customPledgeInput.focus();
      return;
    }

    playStampSound();
    gameState.stage4.customPledge = customText;

    const checkedBoxes = document.querySelectorAll('input[name="peacePledge"]:checked');
    gameState.stage4.selectedPledges = Array.from(checkedBoxes).map(cb => cb.value);

    const student = gameState.student;
    const selectedJobKey = gameState.stage3.selectedJob || 'soldier';
    const jobData = JOB_DATA[selectedJobKey];

    document.getElementById('certSchoolClass').textContent = student.schoolClass;
    document.getElementById('certStudentName').textContent = student.name;
    document.getElementById('certJobTitle').textContent = jobData.badge;
    document.getElementById('certPledgeContent').textContent = `"${customText}"`;

    const now = new Date();
    const dateStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
    document.getElementById('certDate').textContent = dateStr;

    certificateArea.style.display = 'block';
    certificateArea.scrollIntoView({ behavior: 'smooth', block: 'start' });

    setTimeout(() => {
      playSuccessSound();
    }, 400);
  });

  document.getElementById('printCertBtn').addEventListener('click', () => {
    window.print();
  });

  document.getElementById('restartBtn').addEventListener('click', () => {
    initAudio();
    playClickSound();
    if (confirm('처음 화면으로 돌아가 다른 역사적 역할과 선택을 탐구하시겠습니까?')) {
      location.reload();
    }
  });

})();
