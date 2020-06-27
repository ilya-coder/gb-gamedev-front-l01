const app = document.querySelector( '#app' )
const bg = new Image(300, 300)
bg.src = "bg2.jpg"

const canvas = document.createElement( 'canvas' )
canvas.width = 300
canvas.height = 300

app.append( canvas )

const ctx = canvas.getContext( '2d' )
let RAF

class Square {
    constructor(x, y, sideWidth, ctx) {
        this.x = x
        this.y = y
        this.sideWidth = sideWidth
        this.ctx = ctx
        this.status = ''
    }

    /**
     * Проверка соответствия координат объекту
     * @param {number} x Координата клика по X
     * @param {number} y Координата клика по Y
     * @returns {boolean} true - клик по данному объекту, false - мимо
     */
    isClick(x, y) {
        return x >= this.x
            && x <= this.x + this.sideWidth
            && y >= this.y
            && y <= this.y + this.sideWidth;
    }

    /**
     * Если координаты клика соответствуют объекту, выполняет действие
     * @param {number} x Координата клика по X
     * @param {number} y Координата клика по Y
     * @param {string} status x или 0 - чей ход
     * @returns {void}
     */
    onCLick(x, y, status){
        if ( this.isClick(x,y) ) {
            this.status = status
        }
    }

    draw() {
        const ctx = this.ctx

        ctx.save()
        ctx.translate(this.x, this.y)

        if (this.status === 'x') {
            this.drawX()
        } else if (this.status === '0') {
            this.drawZero()
        }

        ctx.restore()
    }

    drawX() {
        const ctx = this.ctx

        ctx.save()
        ctx.translate(15, 85)
        ctx.scale(10, 10)
        ctx.fillText('X', 0, 0)
        ctx.restore()
    }

    drawZero() {
        const ctx = this.ctx

        ctx.save()
        ctx.translate(25, 85)
        ctx.scale(10, 10)
        ctx.fillText('0', 0, 0)
        ctx.restore()
    }
}

class Field {
    /**
     * Генерация игрового поля
     * @param {number} width Ширина поля
     * @param {number} height Высота поля
     * @param {CanvasRenderingContext2D} ctx Контекст канваса
     * @returns {void}
     */
    constructor(width, height, ctx) {
        this.width = width
        this.height = height
        this.ctx = ctx
        this.squares = []
        this.status = 'inGame'

        this.init()
    }

    init() {
        for (let squareNum = 0; squareNum < 3*3; squareNum++) {
            const row = Math.floor(squareNum / 3)
            const col = squareNum % 3
            const side = this.width / 3
            const x = col * side
            const y = row * side

            this.squares.push(new Square(x, y, side, this.ctx))
        }
    }

    /**
     * Проверяет, есть ли на поле заполненная линия с одним
     * из символов (x или 0)
     * @param {string} statusSymbol
     * @param {array} line
     * @param {[number]} extendIndexes Дополнительные индекы, нужны для проверки выйгрышных ходов
     * @returns {boolean} true если найдена линия, иначе false
     */
    checkLine(statusSymbol, line, extendIndexes= []) {
        for (const index of line) {
            if ( extendIndexes.indexOf(index) !== -1 ) {
                continue
            } else if ( this.squares[index].status !== statusSymbol) {
                return false
            }
        }

        return true
    }

    /**
     * Проверяет, выйграл ли один из символов (x или 0)
     * @param {string} statusSymbol
     * @param {[number]} [extendIndexes] Дополнительные индекы, нужны для проверки выйгрышных ходов
     * @returns {boolean}
     */
    checkWinStatus(statusSymbol, extendIndexes ) {
        const winState = [
            [0,1,2],
            [3,4,5],
            [6,7,8],
            [0,3,6],
            [1,4,7],
            [2,5,8],
            [0,4,8],
            [6,4,2],
        ]

        for (const stateLine of winState) {
            if ( this.checkLine(statusSymbol, stateLine, extendIndexes) ) {
                return true
            }
        }

        return false
    }

    /**
     * Обработка клика по полю
     * @param {number} x
     * @param {number} y
     * @returns {void}
     */
    onClick(x, y) {
        this.squares.map( sq => sq.onCLick(x, y, 'x') )
    }

    /**
     * Отрисовка фона
     * @returns {void}
     */
    drawBackground() {
        const ctx = this.ctx
        ctx.save()

        ctx.drawImage(bg, 0, 0)

        ctx.strokeStyle = 'blue'

        for ( let x = this.width / 3; x < this.width; x += (this.width / 3) ) {
            ctx.beginPath()
            ctx.moveTo( x, 0 )
            ctx.lineTo( x, this.height )
            ctx.stroke()
        }

        for ( let y = this.height / 3; y < this.height; y += (this.height / 3) ) {
            ctx.beginPath()
            ctx.moveTo( 0, y )
            ctx.lineTo( this.width, y )
            ctx.stroke()
        }

        ctx.restore()
    }

    /**
     * Запускает процедуру отрисовки в каждой клетке
     * @returns {void}
     */
    drawFigures() {
        this.squares.map( sq => sq.draw() )
    }

    /**
     * Выводит на экран сообщение (в конце игры)
     * @param {string} message Сообщение, которое будет выведено
     * @returns {void}
     */
    drawMsg(message){
        const ctx = this.ctx

        ctx.save()
        ctx.translate(0, 80)
        ctx.fillStyle = 'yellow'
        ctx.fillRect(0,0, canvas.width, 100)
        ctx.restore()

        ctx.save()
        ctx.translate(canvas.width / 2, canvas.height / 2)

        ctx.fillStyle = 'red'
        ctx.strokeStyle = 'red'
        ctx.textAlign = 'center'
        ctx.scale(5,5)
        ctx.fillText(message, 0, 0)
        ctx.restore()
    }

    /**
     * Ход компа
     * @returns {void}
     */
    doComp() {
        let freeIndexes = []

        for (let i = 0; i < this.squares.length; i++) {
            const sq = this.squares[i]
            if (sq.status === '') {
                freeIndexes.push(i)
            }
        }

        // Если нет свободных клеток
        if (!freeIndexes.length) {
            return
        }

        // Если есть возможность выйграть 1 ходом
        for (const index of freeIndexes) {
            if (this.checkWinStatus('0', [index])) {
                console.log(`Найден выйгрышный индекс ${index}`)
                this.squares[ index ].status = '0'
                return
            }
        }

        // Если есть возможность помешать выйграть пользователю
        for (const index of freeIndexes) {
            if (this.checkWinStatus('x', [index])) {
                console.log(`Найден выйгрышный для пользователя индекс ${index}`)
                this.squares[ index ].status = '0'
                return
            }
        }

        // Если есть возможность выйграть в 2 хода
        for (const indexA of freeIndexes) {
            for (const indexB of freeIndexes) {
                if ( indexA === indexB ) {
                    continue
                }

                if (this.checkWinStatus('0', [indexA, indexB])) {
                    console.log(`Найден вероятно выйгрышный индекс ${indexA}`)
                    this.squares[ indexA ].status = '0'
                    return
                }
            }
        }

        // Ставим наугад в свободную
        this.squares[ freeIndexes[ Math.round(Math.random() * 9999) % freeIndexes.length ] ].status = '0'
    }

    /**
     * Определяет ничью
     * @returns {boolean}
     */
    isDraw() {
        for (const sq of this.squares) {
            if (sq.status === '') {
                return false
            }
        }

        return true
    }
}

const gameField = new Field(canvas.width, canvas.height, ctx)

function render() {
    ctx.clearRect( 0, 0, canvas.width, canvas.height )
    gameField.drawBackground()
    gameField.drawFigures()

    if (gameField.status === 'win') {
        gameField.drawMsg('YOU WIN!')
        console.log('Победили человеки :-(')
        cancelAnimationFrame(RAF)
    } else if (gameField.status === 'loose') {
        gameField.drawMsg('YOU LOOSE')
        console.log('Победил сверхразум :-)')
        cancelAnimationFrame(RAF)
    } else if (gameField.status === 'draw') {
        gameField.drawMsg('DRAW')
        console.log('Ничья :-|')
        cancelAnimationFrame(RAF)
    }
}

function canvasClick(event) {
    const {offsetX, offsetY} = event
    gameField.onClick(offsetX, offsetY)

    if (gameField.checkWinStatus('x')) {
        canvas.removeEventListener('click', canvasClick)
        gameField.status = 'win'
        return
    }

    gameField.doComp()

    if (gameField.checkWinStatus('0')) {
        canvas.removeEventListener('click', canvasClick)
        gameField.status = 'loose'
    } else if (gameField.isDraw()) {
        canvas.removeEventListener('click', canvasClick)
        gameField.status = 'draw'
    }
}

function gameLoop() {
    render()
    RAF = requestAnimationFrame( gameLoop )
}

gameLoop()
canvas.addEventListener( 'click', canvasClick)
