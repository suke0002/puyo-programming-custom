// 起動されたときに呼ばれる関数を登録する
window.addEventListener("load", () => {
    // まずステージを整える
    initialize();
    // ゲームを開始する
    loop();
});

let mode; // ゲームの現在の状況
let frame; // ゲームの現在フレーム (1/60秒ごとに1追加される)
let combinationCount = 0; // 何連鎖かどうか

// ENTERキーが押されたか監視するための変数
let isEnterPressed = false;

// キーボードのENTER入力を取得するイベントリスナー
document.addEventListener('keydown', (e) => {
    if (e.keyCode === 13) { // 13はENTERキーのキーコード
        isEnterPressed = true;
    }
});
document.addEventListener('keyup', (e) => {
    if (e.keyCode === 13) {
        isEnterPressed = false;
    }
});

function initialize() {
    // 画像を準備する
    PuyoImage.initialize();
    // ステージを準備する
    Stage.initialize();
    // ユーザー操作の準備をする
    Player.initialize();
    // スコア表示の準備をする
    Score.initialize();
    
    // 最初はタイトル画面からスタート
    mode = 'title';
    frame = 0;
}

function resetGame() {
    // ステージ上のぷよおよびばたんきゅーの画像要素をすべて削除
    const stageElement = Stage.stageElement;
    if (stageElement) {
        const puyoImages = stageElement.querySelectorAll('img[src*="puyo"], img[src*="batankyu"]');
        puyoImages.forEach(img => img.remove());
    }
    
    // スコア表示のHTML要素をすべて削除
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        while (scoreElement.firstChild) {
            scoreElement.removeChild(scoreElement.firstChild);
        }
    }
    
    // ステージの状態を管理する配列のデータを初期化
    for (let y = 0; y < Config.stageRows; y++) {
        for (let x = 0; x < Config.stageCols; x++) {
            Stage.board[y][x] = 0;
        }
    }
    
    // 各クラスの状態を初期化し直す
    Stage.initialize();
    Player.initialize();
    Score.initialize();
    
    // 画面の文字と背景を消去
    document.getElementById('message-overlay').style.background = "rgba(0,0,0,0)";
    document.getElementById('main-message').innerText = "";
    document.getElementById('sub-message').innerText = "";
    
    frame = 0;
    
    // ゲーム開始状態へ
    mode = 'start';
}

function loop() {
    switch(mode) {
        case 'title':
            // タイトル画面状態：ENTERキーが押されたらゲーム開始
            if (isEnterPressed) {
                console.log("ENTERキーの入力を感知しました！"); // ◀この行を一時的に追加
                resetGame();
            }
            break;

        case 'start':
            // 最初は空中にあるかもしれないぷよを自由落下させるところからスタート
            mode = 'checkFall';
            break;

        case 'checkFall':
            // 落ちるかどうか判定する
            if(Stage.checkFall()) {
                mode = 'fall';
            } else {
                // 落ちないならば、ぷよを消せるかどうか判定する
                mode = 'checkErase';
            }
            break;

        case 'fall':
            if(!Stage.fall()) {
                // すべて落ちきったら、ぷよを消せるかどうか判定する
                mode = 'checkErase';
            }
            break;

case 'checkErase':
            // 消せるかどうか判定する
            const eraseInfo = Stage.checkErase(frame);
            if(eraseInfo) {
                mode = 'erasing';
                combinationCount++;
                // 得点を計算する（第4引数に実際の塊の配列データを追加）
                Score.calculateScore(combinationCount, eraseInfo.piece, eraseInfo.color, eraseInfo.puyoGroups);
                Stage.hideZenkeshi();
            } else {
                if(Stage.puyoCount == 0 && combinationCount > 0) {
                    // 全消しの処理をする
                    Stage.showZenkeshi();
                    // 本家ぷよぷよeスポーツの仕様（通ルール）に合わせ、全消しボーナス2100点を加算
                    Score.addScore(2100);
                }
                combinationCount = 0;
                // 消せなかったら、新しいぷよを登場させる
                mode = 'newPuyo';
            }
            break;

        case 'erasing':
            if(!Stage.erasing(frame)) {
                // 消し終わったら、再度落ちるかどうか判定する
                mode = 'checkFall';
            }
            break;

        case 'newPuyo':
            if(!Player.createNewPuyo()) {
                // 新しい操作用ぷよを作成出来なかったら、ゲームオーバー
                mode = 'gameOver';
            } else {
                // プレイヤーが操作可能
                mode = 'playing';
            }
            break;

        case 'playing':
            // プレイヤーが操作する
            const action = Player.playing(frame);
            mode = action; // 'playing' 'moving' 'rotating' 'fix' のどれかが返ってくる
            break;

        case 'moving':
            if(!Player.moving(frame)) {
                // 移動が終わったので操作可能にする
                mode = 'playing';
            }
            break;

        case 'rotating':
            if(!Player.rotating(frame)) {
                // 回転が終わったので操作可能にする
                mode = 'playing';
            }
            break;

        case 'fix':
            // 現在の位置でぷよを固定する
            Player.fix();
            // 固定したら、まず自由落下を確認する
            mode = 'checkFall';
            break;

        case 'gameOver':
            // ばたんきゅーの準備をする
            PuyoImage.prepareBatankyu(frame);
            mode = 'batankyu';
            break;

        case 'batankyu':
            PuyoImage.batankyu(frame);
            Player.batankyu();
            
            // ばたんきゅーアニメーションが一定時間(約2秒 = 120フレーム)経過したらリトライ受付へ
            if (frame - PuyoImage.gameOverFrame > 120) {
                document.getElementById('message-overlay').style.background = "rgba(0,0,0,0.6)";
                document.getElementById('main-message').innerText = "GAME OVER";
                document.getElementById('sub-message').innerText = "PUSH ENTER TO RETRY";
                mode = 'retryWait';
            }
            break;

        case 'retryWait':
            // リトライ待機状態：ENTERキーが押されたらリセットして再開
            if (isEnterPressed) {
                resetGame();
            }
            break;
    }
    frame++;
    requestAnimationFrame(loop); // 1/60秒後にもう一度呼び出す
}