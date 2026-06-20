class Score {
    // static fontTemplateList = [];
    // static fontLength;
    // static score = 0;

    static initialize() {
        this.fontTemplateList = [];
        let fontWidth = 0;
        for(let i = 0; i < 10; i++) {
            const fontImage = document.getElementById(`font${i}`);
            if(fontWidth === 0) {
                fontWidth = fontImage.width / fontImage.height * Config.fontHeight;
            }
            fontImage.height = Config.fontHeight;
            fontImage.width = fontWidth;
            this.fontTemplateList.push(fontImage);
        }

        this.fontLength = Math.floor(Config.stageCols * Config.puyoImgWidth / this.fontTemplateList[0].width);
        this.score = 0;
        this.showScore();
    }
    static showScore () {
        let score = this.score;
        const scoreElement = Stage.scoreElement;
        // まず最初に、scoreElement の中身を空っぽにする
        while(scoreElement.firstChild) {
            scoreElement.removeChild(scoreElement.firstChild);
        }
        // スコアを下の桁から埋めていく
        for(let i = 0; i < this.fontLength; i++) {
            // 10で割ったあまりを求めて、一番下の桁を取り出す
            const number = score % 10;
            // 一番うしろに追加するのではなく、一番前に追加することで、スコアの並びを数字と同じようにする
            scoreElement.insertBefore(this.fontTemplateList[number].cloneNode(true), scoreElement.firstChild);
            // 10 で割って次の桁の準備をしておく
            score = Math.floor(score / 10);
        }
    }
    static calculateScore (rensa, piece, color, puyoGroups) {
        // 本家eスポーツの連鎖ボーナス表（0連鎖〜19連鎖）
        const rensaBonusTable = [
            0, 0, 8, 16, 32, 64, 96, 128, 160, 192, 
            224, 256, 288, 320, 352, 384, 416, 448, 480, 512
        ];

        // 本家eスポーツの連結ボーナス表（0個〜11個以上）
        const pieceBonusTable = [
            0, 0, 0, 0, 0, 2, 3, 4, 5, 6, 7, 10
        ];

        // 本家eスポーツの色数ボーナス表（0色〜5色）
        const colorBonusTable = [
            0, 0, 3, 6, 12, 24
        ];

        // 基本点用に総消去数を保持
        const puyoCount = piece;

        // 連鎖ボーナスと色数ボーナスの取得
        const rIndex = Math.min(rensa, rensaBonusTable.length - 1);
        const cIndex = Math.min(color, colorBonusTable.length - 1);
        
        const rensaBonus = rensaBonusTable[rIndex];
        const colorBonus = colorBonusTable[cIndex];

        // 連結ボーナスの計算
        let pieceBonus = 0;

        if (puyoGroups && puyoGroups.length > 0) {
            // stage.js から渡された「実際の塊の個数リスト」を元に忠実に計算
            puyoGroups.forEach(pCount => {
                const pIndex = Math.min(pCount, pieceBonusTable.length - 1);
                pieceBonus += pieceBonusTable[pIndex];
            });
        } else {
            // 万が一配列が渡されなかった場合のフォールバック（単一の塊として処理）
            const pIndex = Math.min(piece, pieceBonusTable.length - 1);
            pieceBonus = pieceBonusTable[pIndex];
        }
        
        // すべてのボーナスを合算
        let scale = rensaBonus + pieceBonus + colorBonus;
        
        // ボーナス合計が0の場合は、本家ルール通り倍率を1（等倍）にする
        if(scale === 0) {
            scale = 1;
        }
        
        // 得点 = 消したぷよの個数 × 10 × 全体のボーナス倍率
        this.addScore(puyoCount * 10 * scale);
    }
    static addScore (score) {
        this.score += score;
        this.showScore();
    }
};

Score.rensaBonus = [0, 8, 16, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, 480, 512, 544, 576, 608, 640, 672];
Score.pieceBonus = [0, 0, 0, 0, 2, 3, 4, 5, 6, 7, 10, 10];
Score.colorBonus = [0, 0, 3, 6, 12, 24];
