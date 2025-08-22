const homeTemplate = (
  endpoint: string,
  serverName: string | undefined,
  serverDescription: string | undefined
) => `
<!DOCTYPE html>
<html>
  <head>
    <title>${serverName || "xmcp server"}</title>
    <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
      body {
        background: #000;
        font-family: 'Geist Mono', monospace;
        color: #fff;
        margin: 0;
        padding: 0;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
      .content-stack {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
        margin-top: 40px;
      }
      .endpoint-btn {
        display: inline-block;
        position: relative;
        background: transparent;
        color: #fff;
        font-family: 'Geist Mono', monospace;
        font-size: 16px;
        font-weight: 400;
        text-transform: uppercase;
        border: none;
        padding: 10px 18px;
        text-decoration: none;
        cursor: pointer;
        z-index: 1;
      }
      .endpoint-btn::before {
        content: '';
        position: absolute;
        inset: 0;
        padding: 2px;
        background: linear-gradient(135deg, #e6e6e6, #999999, #666666, #b3b3b3);
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        mask-composite: exclude;
        z-index: 0;
        pointer-events: none;
      }
      .endpoint-btn::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        right: 2px;
        bottom: 2px;
        background: #000000;
        border: 1px solid #ffffff;
        box-shadow: 
          0px 1px 2px rgba(0,0,0,0.3),
          inset 0 1px 0 rgba(255,255,255,0.6),
          inset 0 -1px 0 rgba(255,255,255,0.3),
          inset 1px 0 0 rgba(255,255,255,0.3),
          inset -1px 0 0 rgba(255,255,255,0.3);
        z-index: -1;
        pointer-events: none;
      }
      .paragraph {
        color: #999999;
        font-size: 0.875rem;
        font-weight: 400;
        text-align: center;
        max-width: 400px;
        margin: 0;
        text-wrap: pretty;
      }
      .copied-feedback {
        color: #4ade80;
        font-size: 0.8rem;
        opacity: 0;
        transition: opacity 0.3s ease;
        margin-top: 8px;
      }
      .copied-feedback.show {
        opacity: 1;
      }
    </style>
    <script>
      function copyToClipboard(endpoint) {
        const fullUrl = window.location.origin + endpoint;
        navigator.clipboard.writeText(fullUrl).then(function() {
          const feedback = document.querySelector('.copied-feedback');
          feedback.classList.add('show');
          setTimeout(function() {
            feedback.classList.remove('show');
          }, 3000);
        }).catch(function(err) {
          console.error('Failed to copy: ', err);
          alert('Failed to copy to clipboard');
        });
      }
    </script>
  </head>
  <body>
    <div class="content-stack">
      <svg width="191" height="70" viewBox="0 0 191 70" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M154.026 52.8822V55.2865H171.662V52.8822H166.623V41.6292H169.142V44.1381H174.182V46.6467H176.701V44.1381H181.741V41.6292H184.26V21.5588H181.741V16.5411H179.22V14.0322H174.182V11.5236H169.142V14.0322H164.104V16.5411H161.584V19.05H154.026V21.5588H156.545V52.8822H154.026ZM169.142 41.6292V39.1203H166.623V16.5411H169.142V19.05H171.662V21.5588H174.182V41.6292H169.142Z" fill="#F7F7F7"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M136.03 49.5743H138.974V46.6474H141.919V43.7204H147.806V46.6474H144.863V49.5743H141.919V52.5012H138.974V55.4282H130.142V52.5012H124.253V49.5743H121.31V29.0859H118.366V26.1589H121.31V23.232H124.253V20.305H127.198V17.3781H133.086V14.4511H138.974V11.5242H141.919V14.4511H144.863V17.3781H147.806V20.305H150.751V23.232H147.806V32.0128H144.863V29.0859H141.919V26.1589H138.974V23.232H136.03V20.305H133.086V46.6474H136.03V49.5743ZM147.806 43.7204V40.7935H150.751V43.7204H147.806Z" fill="#F7F7F7"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M105.787 11.5236V14.4505H102.843V17.3775H99.8992V20.3044H94.0106V17.3775H91.067V14.4505H88.1227V11.5236H85.1784V14.4505H82.2341V17.3775H79.2905V20.3044H73.4019V17.3775H70.4576V14.4505H67.514V11.5236H64.5697V14.4505H61.6254V17.3775H55.7375V20.3044H61.6254V49.5737H58.6811V52.5006H64.5697V55.4276H70.4576V52.5006H76.3462V49.5737H73.4019V23.2313H79.2905V20.3044H82.2341V49.5737H79.2905V52.5006H85.1784V55.4276H91.067V52.5006H96.9549V49.5737H94.0106V23.2313H99.8992V20.3044H102.843V49.5737H99.8992V52.5006H105.787V55.4276H111.676V52.5006H117.564V49.5737H114.619V23.2313H117.564V20.3044H114.619V17.3775H111.676V14.4505H108.731V11.5236H105.787Z" fill="#F7F7F7"/>
        <path d="M0 14.5833H2.94002V17.5H0V14.5833ZM2.94002 64.1667V55.4167H5.88004V52.5H8.82006V49.5833H14.7001V46.6667H17.6401V43.75H20.5802V49.5833H26.4602V52.5H29.4002V55.4167H32.3402V58.3333H29.4002V61.25H26.4602V64.1667H23.5202V61.25H20.5802V58.3333H14.7001V61.25H11.7601V67.0833H14.7001V70H8.82006V67.0833H5.88004V64.1667H2.94002ZM2.94002 14.5833V8.75H5.88004V5.83333H8.82006V2.91667H20.5802V5.83333H26.4602V8.75H29.4002V14.5833H32.3402V17.5H35.2803V20.4167H38.2203V23.3333H35.2803V26.25H49.9804V29.1667H47.0403V32.0833H41.1603V37.9167H44.1003V40.8333H47.0403V43.75H49.9804V49.5833H52.9204V52.5H55.8604V55.4167H49.9804V58.3333H47.0403V61.25H44.1003V58.3333H41.1603V52.5H38.2203V46.6667H35.2803V43.75H32.3402V37.9167H26.4602V35H5.88004V32.0833H8.82006V29.1667H11.7601V26.25H23.5202V23.3333H20.5802V17.5H17.6401V11.6667H14.7001V8.75H11.7601V11.6667H5.88004V14.5833H2.94002ZM20.5802 43.75V40.8333H23.5202V43.75H20.5802ZM23.5202 40.8333V37.9167H26.4602V40.8333H23.5202ZM32.3402 55.4167V52.5H35.2803V55.4167H32.3402ZM32.3402 14.5833V11.6667H35.2803V14.5833H32.3402ZM35.2803 11.6667V8.75H38.2203V2.91667H44.1003V5.83333H49.9804V2.91667H55.8604V11.6667H52.9204V14.5833H47.0403V17.5H44.1003V14.5833H41.1603V20.4167H38.2203V11.6667H35.2803ZM55.8604 52.5V49.5833H58.8004V52.5H55.8604ZM55.8604 2.91667V0H58.8004V2.91667H55.8604Z" fill="#F7F7F7"/>
        <path d="M187.802 17.7814C186.008 17.7814 184.579 16.3382 184.579 14.5664C184.579 12.7947 186.008 11.3632 187.802 11.3632C189.584 11.3632 191 12.7947 191 14.5664C191 16.3382 189.584 17.7814 187.802 17.7814ZM187.802 17.1478C189.3 17.1478 190.315 15.9745 190.315 14.5664C190.315 13.1584 189.3 11.9968 187.802 11.9968C186.291 11.9968 185.264 13.1584 185.264 14.5664C185.264 15.9745 186.291 17.1478 187.802 17.1478ZM186.515 16.3265V12.8299H187.684C188.592 12.8299 189.135 13.2288 189.135 13.8976C189.135 14.3904 188.852 14.7424 188.368 14.8715L189.277 16.3265H188.533L187.719 14.9536H187.176V16.3265H186.515ZM187.176 14.4139H187.778C188.238 14.4139 188.498 14.2027 188.498 13.8741C188.498 13.5573 188.238 13.3813 187.778 13.3813H187.176V14.4139Z" fill="#F7F7F7"/>
      </svg>
      <p class="paragraph">
        ${serverDescription}
      </p>
      <button class="endpoint-btn" onclick="copyToClipboard('${endpoint}')">GET ENDPOINT</button>
    </div>
    <p class="copied-feedback">Copied!</p>
  </body>
</html>
`;

export default homeTemplate;
