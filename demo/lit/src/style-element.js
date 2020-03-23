import { css } from 'lit-element';

export const plotStyleElement = css`

.plot-legend{
    margin: 10px 20px;
    margin-right: 40px;
}

.plot-legend .legend-items{
    padding: 8px 0;
    border-top: solid 1px #667766;
}
.plot-legend .plot-btn-group{
    float:left;
    margin-right:20px;
}
.plot-legend .plot-button{
    width: 28px;
    height: 28px;
    border-radius: 20%;
    border: 2px solid #989898;
    margin: 4px;
    margin-right: 8px;
    background: linear-gradient(200deg,rgba(120,120,120,0),rgba(120,120,120,.09),rgba(120,120,120,.26));
    box-sizing: border-box;
    transition: transform .2s ease-out;
}
.plot-legend .btn-col{
    height: 36px;
    width: 40px;
}
.plot-legend .plot-button.active{
    transform: scale(1.1429,1.1429);
    transform-origin: 50% 50%;
    border-radius: 20%;
    border-width: 0;
}
.plot-legend .plot-btn-group-list{
    padding: 0
}
.ts-row{
    display: flex;
    align-content: center;
    align-items: center;
    padding: 0;
    list-style: none;
    justify-content: space-between;
    text-align:left;
}
.plot-legend .ts-row .plot-label{
    min-width: 140px;
}
.plot-legend .ts-row .plot-unit{
    margin-left: 4px;
    min-width: 30px;
}
`;
