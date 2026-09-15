/**
 * 1953: 다시 찾은 평화 - 초등 10분 수업 정리용 인터랙티브 방탈출 게임
 * 
 * - 단계별 진행 제어 (Intro -> Stage 1 -> Stage 2 -> Stage 3 -> Stage 4)
 * - Web Audio API 기반 효과음 및 사운드 신시사이저 (외부 오디오 의존 없음)
 * - 초등학생 친화적 직관적 클릭/드래그 퍼즐 로직
 * - 개인별 맞춤 평화 시민 임명장 생성 및 인쇄 기능
 */

(() => {
  'use strict';

  // ==========================================================================
  // 1. 상태(State) 관리
  // ==========================================================================
  const gameState = {
    currentStep: 'intro', // 'intro' | 'stage1' | 'stage2' | 'stage3' | 'stage4'
    student: {
      schoolClass: '평화초등학교 6학년',
      name: '김평화'
    },
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

  // 4가지 직업군 상세 데이터
  const JOB_DATA = {
    soldier: {
      name: '국군 장병',
      badge: '평화 지킴이 (국군 장병 부문)',
      icon: '🛡️',
      role: '평화를 지키는 든든한 등대',
      story: `
        "포성이 멈춘 후, 우리는 다시는 사랑하는 가족과 친구들을 잃지 않도록 밤낮으로 국경을 지켰습니다.<br>
        무너진 한강 다리를 임시로 잇고, 피란민들이 고향으로 돌아갈 수 있도록 흙먼지를 뒤집어쓰며 길을 닦았습니다.
        전쟁의 상처 속에서도 고아들을 부대로 데려와 따뜻한 밥을 먹이고 희망을 심어주었습니다."
      `,
      lesson: '평화는 거저 주어지는 것이 아니며, 안전을 지켜주는 든든한 힘과 희생이 있었기에 오늘날 우리가 평화롭게 공부할 수 있습니다.'
    },
    shoeshine: {
      name: '구두닦이 소년',
      badge: '희망의 소년 가장 (청소년 자립 부문)',
      icon: '👟',
      role: '어려움 속에서도 피어난 불굴의 희망',
      story: `
        "전쟁으로 부모님을 잃고 어린 동생 둘을 데리고 부산 역전으로 내려왔습니다.
        무거운 구두통을 메고 하루 종일 뛰어다니며 어른들의 구두를 닦았지요.<br>
        손은 새까매지고 발은 부텄지만, 번 돈으로 주먹밥을 사서 더 어린 동생들과 나누어 먹었습니다.
        '오늘을 견디면 반드시 밝은 내일이 올 거야!'라는 믿음으로 끝까지 포기하지 않았습니다."
      `,
      lesson: '아무리 큰 어려움이 닥쳐도 꿋꿋이 일어서며, 나보다 더 힘든 이웃을 배려하는 따뜻한 나눔이 진정한 평화의 시작입니다.'
    },
    merchant: {
      name: '국제시장 상인',
      badge: '따뜻한 연대 (공동체 회복 부문)',
      icon: '🍎',
      role: '마을의 온기와 경제를 되살린 어머니·아버지',
      story: `
        "잿더미가 된 부산 국제시장 한쪽에 사과 궤짝을 놓고 미군 보급 물품과 남새(채소)를 팔기 시작했습니다.
        돈이 없는 이재민에게는 덤으로 보리쌀을 한 움큼 더 쥐여주었고, 굶주린 아이들에게는 국수를 말아주었습니다.<br>
        서로의 눈물을 닦아주고 장사를 돕다 보니, 어느새 시장은 활기를 되찾고 대한민국 경제를 다시 뛰게 한 심장이 되었습니다."
      `,
      lesson: '공동체의 아픔을 함께 나누고 서로의 손을 잡아주는 연대의 힘이 무너진 일상을 회복하는 가장 큰 원동력이었습니다.'
    },
    teacher: {
      name: '천막학교 선생님',
      badge: '미래의 등불 (교육 및 평화 교육 부문)',
      icon: '📚',
      role: '어린이의 마음에 심은 평화의 씨앗',
      story: `
        "교실도 책상도 다 불타버렸지만, 미군 천막을 빌려 흙바닥 위에 작은 학교를 열었습니다.
        공책이 부족해 시멘트 포대 종이에 글을 썼고, 나뭇가지로 흙에 한글을 쓰며 아이들을 가르쳤습니다.<br>
        '전쟁은 부서진 건물을 남겼지만, 너희들의 꿈은 그 누구도 부술 수 없단다.'
        아이들의 초롱초롱한 눈망울에서 평화로운 미래 대한민국의 희망을 보았습니다."
      `,
      lesson: '배움을 향한 열정과 다음 세대에게 평화의 가치를 가르치는 교육이 오늘날 번영한 대한민국의 튼튼한 뿌리가 되었습니다.'
    }
  };

  // ==========================================================================
  // 2. Web Audio API 신시사이저 (효과음)
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

  // 간단한 클릭음
  function playClickSound() {
    if (!gameState.soundEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  // 성공 효과음 (상승 아르페지오)
  function playSuccessSound() {
    if (!gameState.soundEnabled || !audioCtx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.09);
        gain.gain.setValueAtTime(0, audioCtx.currentTime + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + idx * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.09 + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.09);
        osc.stop(audioCtx.currentTime + idx * 0.09 + 0.25);
      });
    } catch (e) {
      console.warn('Success sound error', e);
    }
  }

  // 자물쇠 딸깍 해제음
  function playUnlockSound() {
    if (!gameState.soundEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch (e) {}
  }

  // 붉은 인장 도장 찍는 쿵 소리
  function playStampSound() {
    if (!gameState.soundEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {}
  }

  // 라디오 주파수 맞췄을 때 맑은 차임벨 소리
  function playRadioChime() {
    if (!gameState.soundEnabled || !audioCtx) return;
    try {
      const notes = [659.25, 880, 1174.66]; // E5, A5, D6
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.12 + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.12);
        osc.stop(audioCtx.currentTime + idx * 0.12 + 0.5);
      });
    } catch (e) {}
  }

  // ==========================================================================
  // 3. UI 및 진행 제어 (Step Navigation)
  // ==========================================================================
  const screens = {
    intro: document.getElementById('screenIntro'),
    stage1: document.getElementById('screenStage1'),
    stage2: document.getElementById('screenStage2'),
    stage3: document.getElementById('screenStage3'),
    stage4: document.getElementById('screenStage4')
  };

  const stepItems = document.querySelectorAll('.step-item');
  const progressBar = document.getElementById('progressBar');
  const timerPill = document.getElementById('playTimer');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');
  const soundLabel = document.getElementById('soundLabel');

  function updateStepNav(targetStep) {
    gameState.currentStep = targetStep;
    const stepOrder = ['intro', 'stage1', 'stage2', 'stage3', 'stage4'];
    const activeIdx = stepOrder.indexOf(targetStep);

    // Progress bar fill width
    const percent = ((activeIdx) / (stepOrder.length - 1)) * 100;
    progressBar.style.setProperty('--progress-width', `${Math.max(10, percent)}%`);

    stepItems.forEach((item, idx) => {
      item.classList.remove('active', 'completed');
      if (idx < activeIdx) {
        item.classList.add('completed');
      } else if (idx === activeIdx) {
        item.classList.add('active');
      }
    });

    // Screen visibility toggle
    Object.keys(screens).forEach(key => {
      if (key === targetStep) {
        screens[key].classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        screens[key].classList.remove('active');
      }
    });

    // 1단계, 2단계 진입 시 셔플 (1대1 매칭 방지)
    if (targetStep === 'stage1' && gameState.stage1.helpedTargets.size === 0) {
      shuffleReliefElements();
    } else if (targetStep === 'stage2' && gameState.stage2.placedTiles.size === 0) {
      shuffleTiles();
    }
  }

  // 타이머 작동
  function startTimer() {
    if (gameState.timerInterval) return;
    gameState.timerInterval = setInterval(() => {
      gameState.timerSeconds++;
      const mins = String(Math.floor(gameState.timerSeconds / 60)).padStart(2, '0');
      const secs = String(gameState.timerSeconds % 60).padStart(2, '0');
      timerPill.textContent = `⏱️ ${mins}:${secs}`;
    }, 1000);
  }

  // 사운드 토글
  soundToggleBtn.addEventListener('click', () => {
    initAudio();
    gameState.soundEnabled = !gameState.soundEnabled;
    if (gameState.soundEnabled) {
      soundIcon.textContent = '🔊';
      soundLabel.textContent = '음향 켜짐';
      playClickSound();
    } else {
      soundIcon.textContent = '🔇';
      soundLabel.textContent = '음향 꺼짐';
    }
  });

  // ==========================================================================
  // 4. 인트로 화면 이벤트
  // ==========================================================================
  const studentForm = document.getElementById('studentForm');
  const schoolClassInput = document.getElementById('schoolClass');
  const studentNameInput = document.getElementById('studentName');

  studentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    initAudio();
    playSuccessSound();

    const school = schoolClassInput.value.trim() || '평화초등학교 6학년';
    const name = studentNameInput.value.trim() || '어린이 평화지킴이';

    gameState.student.schoolClass = school;
    gameState.student.name = name;

    startTimer();
    updateStepNav('stage1');
  });

  // ==========================================================================
  // 5. 1단계: 판자방 탈출 (구호물품 나눔 & 라디오 주파수)
  // ==========================================================================
  // (1) 구호물품 나눔
  const itemCards = document.querySelectorAll('.item-card');
  const neighborCards = document.querySelectorAll('.neighbor-card');
  const reliefStatus = document.getElementById('reliefStatus');

  // 물품과 알맞은 이웃 매핑
  const MATCHING_PAIRS = {
    blanket: 'baby',     // 누비담요 -> 추위에 떠는 갓난아이
    food: 'hungry',      // 주먹밥 -> 굶주린 남매
    medicine: 'elder'    // 상비약 -> 다리 다친 할아버지
  };

  const NEIGHBOR_THANKS = {
    baby: '👶 "담요 덕분에 아기가 따뜻하게 잠들었어요. 감사합니다!"',
    hungry: '👧 "따뜻한 주먹밥 덕분에 배고픔을 달랬어요. 고맙습니다!"',
    elder: '👴 "상비약으로 상처를 닦으니 한결 살 것 같소. 은혜를 잊지 않겠네."'
  };

  // 1단계 요소 섞기 함수 (1번째-1번째, 2번째-2번째 일치 방지)
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

    // 1대1 인덱스 일치가 하나도 없도록 최대 20번 섞기 시도
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

  // 2단계 가치 타일 섞기 함수 (슬롯 순서와 일치 방지)
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

  // 초기 로드 시 1회 섞기 실행
  shuffleReliefElements();
  shuffleTiles();

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
        alert('먼저 전해드릴 [구호 물품]을 위에서 선택해 주세요!');
        return;
      }

      // 일치 검사
      if (MATCHING_PAIRS[gameState.stage1.selectedItem] === targetId) {
        // 성공
        playSuccessSound();
        gameState.stage1.helpedTargets.add(targetId);

        // 물품 상태 변경
        const usedItemCard = document.getElementById(`item-${gameState.stage1.selectedItem}`);
        usedItemCard.classList.remove('selected');
        usedItemCard.classList.add('used');
        usedItemCard.disabled = true;

        // 이웃 카드 상태 변경
        card.classList.add('helped');
        card.querySelector('.target-speech').textContent = NEIGHBOR_THANKS[targetId];
        card.querySelector('.target-state').textContent = '온기 전달 완료! 💛';

        gameState.stage1.selectedItem = null;

        // 현황 갱신
        reliefStatus.textContent = `${gameState.stage1.helpedTargets.size} / 3 완료`;
        if (gameState.stage1.helpedTargets.size === 3) {
          reliefStatus.textContent = '3 / 3 나눔 완료! ✨';
          reliefStatus.classList.add('done');
          checkStage1Completion();
        }
      } else {
        // 불일치 안내
        playClickSound();
        alert('이 이웃에게는 다른 구호 물품이 더 급해 보여요. 물품의 설명을 다시 읽어보고 골라보세요!');
      }
    });
  });

  // (2) 라디오 주파수 맞추기
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
    // 슬라이더 바늘 위치 (min 160 ~ max 230)
    const percent = ((val - 160) / (230 - 160)) * 100;
    freqNeedle.style.left = `${percent}%`;
    currentFreq.innerHTML = `현재 주파수: <strong>${val.toFixed(1)} MHz</strong>`;

    // 정답 주파수: 195.3 MHz (오차범위 ±0.6)
    if (Math.abs(val - 195.3) <= 0.6) {
      if (!gameState.stage1.radioTuned) {
        gameState.stage1.radioTuned = true;
        playRadioChime();
        radioLed.classList.add('tuned');
        radioMessageBox.classList.add('broadcast-active');
        radioStatus.textContent = '평화 방송 수신 완료! 📻';
        radioStatus.classList.add('done');
        radioBroadcastText.innerHTML = `
          <strong>📢 [1953년 7월 긴급 평화 방송]</strong><br>
          "지지직... 국민 여러분, 포성이 마침내 멎었습니다!<br>
          비록 모든 것이 부서졌지만, 서로의 손을 맞잡고 폐허 위에 다시 평화로운 일상을 세웁시다!"
        `;
        checkStage1Completion();
      }
    } else {
      if (gameState.stage1.radioTuned) {
        // 약간 벗어났을 때도 너무 엄격하게 풀리지 않도록 유지
      } else {
        radioLed.classList.remove('tuned');
        radioMessageBox.classList.remove('broadcast-active');
        if (Math.abs(val - 195.3) <= 4.0) {
          radioBroadcastText.textContent = '치지직... "...국민... 여러분... 평화..." 신호가 잡힐 듯합니다! 조금만 더 미세하게 돌려보세요!';
        } else {
          radioBroadcastText.textContent = '치지직... 삐익... 잡음만 들립니다. 주파수를 195.3으로 맞춰보세요!';
        }
      }
    }
  });

  // 1단계 탈출구 해제 확인
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
        doorIcon.textContent = '🔓';
        doorTitle.textContent = '희망의 열쇠를 찾았습니다! ✨';
        doorSub.textContent = '나눔의 온기와 평화의 소리가 문을 열었습니다. 이제 아래 버튼을 눌러 마을 광장으로 나가보세요!';
        doorCard.classList.add('unlocked');
        stage1NextBtn.disabled = false;
        stage1NextBtn.classList.add('pulse');
      }
    }
  }

  stage1NextBtn.addEventListener('click', () => {
    initAudio();
    playSuccessSound();
    updateStepNav('stage2');
  });

  // ==========================================================================
  // 6. 2단계: 마을 광장 재건 (평화 가치 타일 퍼즐)
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

    // 드래그 지원
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
        alert('먼저 왼쪽에서 올바른 [평화 가치 타일]을 클릭해 주세요!');
        return;
      }

      if (gameState.stage2.selectedTile === acceptVal) {
        placeTileInSlot(gameState.stage2.selectedTile, slot);
      } else {
        playClickSound();
        alert('이 자리의 약속 설명과 어울리는 다른 가치 타일을 골라보세요!');
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

    // 슬롯 내용 변경
    slotElement.classList.add('filled');
    const tileTitle = matchedTile.querySelector('.tile-title').textContent;
    const tileIcon = matchedTile.querySelector('.tile-icon').textContent;
    const tileSub = matchedTile.querySelector('.tile-sub').textContent;

    slotElement.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 2rem;">${tileIcon}</span>
        <div>
          <strong style="color: var(--peace-green); font-size: 1.1rem;">【약속 완성】 ${tileTitle}</strong>
          <p style="color: var(--sepia-dark); font-size: 0.85rem; margin-top: 2px;">${tileSub} - 약속이 굳건히 세워졌습니다!</p>
        </div>
      </div>
    `;

    gameState.stage2.selectedTile = null;

    // 모든 타일 배치 완료 검사
    if (gameState.stage2.placedTiles.size === 3) {
      gameState.stage2.isRebuilt = true;
      rebuildBanner.classList.add('active');
      stage2NextBtn.disabled = false;
      stage2NextBtn.classList.add('pulse');
    }
  }

  stage2NextBtn.addEventListener('click', () => {
    initAudio();
    playSuccessSound();
    updateStepNav('stage3');
  });

  // ==========================================================================
  // 7. 3단계: 평화의 선택 (4대 직업군 선택)
  // ==========================================================================
  const jobCards = document.querySelectorAll('.job-card');
  const jobDetailBox = document.getElementById('jobDetailBox');
  const detailIcon = document.getElementById('detailIcon');
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
      detailIcon.textContent = data.icon;
      detailTitle.textContent = `${data.name}의 발자취`;
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
  // 8. 4단계: 오늘날 나의 평화 다짐 & 임명장 생성
  // ==========================================================================
  const customPledgeInput = document.getElementById('customPledgeText');
  const presetBadges = document.querySelectorAll('.badge-btn');
  const makeCertBtn = document.getElementById('makeCertBtn');
  const certificateArea = document.getElementById('certificateArea');

  // 추천 다짐 문장 클릭 시 자동 입력
  presetBadges.forEach(btn => {
    btn.addEventListener('click', () => {
      initAudio();
      playClickSound();
      customPledgeInput.value = btn.getAttribute('data-preset');
      customPledgeInput.focus();
    });
  });

  // 임명장 생성
  makeCertBtn.addEventListener('click', () => {
    initAudio();
    const customText = customPledgeInput.value.trim();
    if (!customText) {
      alert('나만의 평화 한 줄 다짐을 적어주세요! (아래 추천 문장을 누르셔도 좋습니다.)');
      customPledgeInput.focus();
      return;
    }

    playStampSound();
    gameState.stage4.customPledge = customText;

    // 체크된 항목들 취합
    const checkedBoxes = document.querySelectorAll('input[name="peacePledge"]:checked');
    gameState.stage4.selectedPledges = Array.from(checkedBoxes).map(cb => cb.value);

    // 임명장 DOM 채우기
    const student = gameState.student;
    const selectedJobKey = gameState.stage3.selectedJob || 'soldier';
    const jobData = JOB_DATA[selectedJobKey];

    document.getElementById('certSchoolClass').textContent = student.schoolClass;
    document.getElementById('certStudentName').textContent = student.name;
    document.getElementById('certJobTitle').textContent = jobData.badge;
    document.getElementById('certPledgeContent').textContent = `"${customText}"`;

    // 오늘 날짜 표시
    const now = new Date();
    const dateStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
    document.getElementById('certDate').textContent = dateStr;

    // 일련번호 생성 (랜덤 난수)
    const randomSeq = String(Math.floor(1000 + Math.random() * 9000));
    document.getElementById('certNumber').textContent = `제 ${now.getFullYear()}-평화-${randomSeq}호`;

    // 임명장 화면 노출
    certificateArea.style.display = 'block';
    certificateArea.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // 축하 팡파레 효과음
    setTimeout(() => {
      playSuccessSound();
    }, 400);
  });

  // 인쇄 및 PDF 저장 버튼
  document.getElementById('printCertBtn').addEventListener('click', () => {
    window.print();
  });

  // 처음부터 다시 하기
  document.getElementById('restartBtn').addEventListener('click', () => {
    initAudio();
    playClickSound();
    if (confirm('처음 화면으로 돌아가 다른 평화의 길을 체험해 보시겠습니까?')) {
      location.reload();
    }
  });

})();
