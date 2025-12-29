const FALLBACK_DESCRIPTION = "This MCP server was bootstrapped with xmcp.";

const ICONS = {
  cursor: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g clip-path="url(#cursor)">
        <path d="M18.1937 4.73376L10.1872 0.111231C9.93007 -0.0372398 9.61283 -0.0372398 9.35573 0.111231L1.34956 4.73376C1.13344 4.85855 1 5.08934 1 5.33929V14.6606C1 14.9106 1.13344 15.1414 1.34956 15.2662L9.3561 19.8887C9.6132 20.0372 9.93044 20.0372 10.1875 19.8887L18.1941 15.2662C18.4102 15.1414 18.5436 14.9106 18.5436 14.6606V5.33929C18.5436 5.08934 18.4102 4.85855 18.1941 4.73376H18.1937ZM17.6908 5.71291L9.96164 19.1001C9.90939 19.1903 9.77145 19.1535 9.77145 19.049V10.2832C9.77145 10.108 9.67785 9.94603 9.526 9.85808L1.9348 5.47536C1.84459 5.42311 1.88143 5.28517 1.98592 5.28517H17.4442C17.6637 5.28517 17.8009 5.5231 17.6912 5.71329H17.6908V5.71291Z" fill="currentColor" />
      </g>
      <defs>
        <clipPath id="cursor">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  `,
  claude: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g clip-path="url(#claude)">
        <path d="M3.92841 13.2962L7.85957 11.0903L7.92541 10.8981L7.85957 10.7918H7.66732L7.00957 10.7513L4.76324 10.6906L2.81532 10.6097L0.928158 10.5085L0.452574 10.4072L0.00732422 9.82042L0.0528242 9.52692L0.452574 9.25875L1.02424 9.30942L2.28916 9.39542L4.18641 9.52692L5.56257 9.60792L7.60157 9.82042H7.92541L7.97091 9.68883L7.85957 9.60792L7.77357 9.52692L5.81057 8.19633L3.68557 6.78975L2.57257 5.98025L1.97049 5.57042L1.66691 5.18592L1.53541 4.34608L2.08182 3.744L2.81541 3.79458L3.00257 3.84517L3.74632 4.41683L5.33499 5.64633L7.40941 7.17433L7.71299 7.42725L7.83441 7.34125L7.84957 7.28058L7.71291 7.05283L6.58466 5.01392L5.38049 2.9395L4.84424 2.0795L4.70257 1.56333C4.65199 1.35083 4.61657 1.17383 4.61657 0.95625L5.23891 0.11125L5.58282 0L6.41257 0.111333L6.76174 0.414833L7.27774 1.59375L8.11257 3.45058L9.40782 5.97525L9.78724 6.724L9.98966 7.41717L10.0655 7.62967H10.1971V7.50825L10.3033 6.08658L10.5007 4.341L10.6929 2.09458L10.7587 1.46217L11.0723 0.70325L11.6947 0.293417L12.1803 0.526167L12.5801 1.09783L12.5244 1.46725L12.2867 3.01033L11.8212 5.42875L11.5176 7.04783H11.6947L11.8971 6.84542L12.7167 5.75767L14.0928 4.03742L14.7 3.35442L15.4083 2.60058L15.8637 2.24133H16.7237L17.3562 3.18242L17.0729 4.15383L16.1875 5.277L15.4538 6.22817L14.4015 7.64483L13.7437 8.77817L13.8045 8.86925L13.9613 8.854L16.3392 8.34817L17.6243 8.11533L19.1573 7.85225L19.8505 8.17608L19.9263 8.50492L19.6532 9.17783L18.014 9.58258L16.0913 9.96708L13.2277 10.6451L13.1922 10.6704L13.2327 10.721L14.5229 10.8424L15.0744 10.8728H16.4252L18.9398 11.06L19.5975 11.495L19.9922 12.0263L19.9263 12.4311L18.9145 12.9472L17.5484 12.6233L14.3609 11.8644L13.2682 11.5912H13.1163V11.6822L14.0271 12.5728L15.6967 14.0804L17.7862 16.0232L17.8925 16.5039L17.6243 16.8834L17.341 16.8429L15.5044 15.4617L14.7961 14.8393L13.1922 13.4885H13.086V13.6302L13.4553 14.1715L15.4083 17.106L15.5095 18.0066L15.3678 18.3L14.8619 18.4771L14.3053 18.3759L13.1619 16.7721L11.9831 14.9658L11.0319 13.3468L10.9155 13.4127L10.3538 19.4587L10.0908 19.7672L9.48366 20L8.97774 19.6155L8.70957 18.9932L8.97774 17.7638L9.30157 16.1599L9.56466 14.8849L9.80241 13.3012L9.94407 12.7751L9.93399 12.7397L9.81757 12.7548L8.62357 14.3942L6.80724 16.848L5.37032 18.386L5.02632 18.5227L4.42932 18.214L4.48491 17.6625L4.81891 17.1717L6.80724 14.642L8.00632 13.0737L8.78049 12.168L8.77532 12.0364H8.72982L3.44774 15.4668L2.50666 15.5882L2.10191 15.2087L2.15257 14.5864L2.34482 14.384L3.93349 13.2912L3.92841 13.2962Z" fill="currentColor" />
      </g>
      <defs>
        <clipPath id="claude">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  `,
  windsurf: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g clip-path="url(#windsurf)">
        <path d="M19.625 4.2225C18.6218 4.22084 17.8078 5.03334 17.8078 6.03625V10.0926C17.8078 10.9026 17.1382 11.5588 16.3414 11.5588C15.8681 11.5588 15.3954 11.3204 15.1149 10.9205L10.9722 5.00359C10.6284 4.51225 10.0691 4.21942 9.46358 4.21942C8.51908 4.21942 7.66917 5.02234 7.66917 6.01359V10.0933C7.66917 10.9033 7.00508 11.5595 6.20283 11.5595C5.72783 11.5595 5.25592 11.3212 4.9755 10.9213L0.339667 4.29984C0.235167 4.14984 0 4.224 0 4.40684V7.9445C0 8.12342 0.0546667 8.29684 0.157 8.44367L4.71933 14.9589C4.98883 15.3439 5.3865 15.6299 5.84508 15.7338C6.99267 15.9946 8.04892 15.1113 8.04892 13.9857V9.90817C8.04892 9.09817 8.70517 8.44209 9.51525 8.44209H9.51775C9.75841 8.44214 9.99552 8.50016 10.209 8.61125C10.4225 8.72233 10.6061 8.8832 10.7442 9.08025L14.8878 14.9964C15.2324 15.4885 15.7628 15.7806 16.3956 15.7806C17.3612 15.7806 18.1885 14.9768 18.1885 13.9864V9.90742C18.1885 9.09742 18.8447 8.44125 19.6548 8.44125H19.8165C19.8406 8.4413 19.8645 8.43658 19.8868 8.42738C19.9091 8.41817 19.9293 8.40466 19.9464 8.38762C19.9635 8.37057 19.977 8.35033 19.9862 8.32804C19.9955 8.30576 20.0002 8.28187 20.0002 8.25775V4.40609C20.0002 4.38197 19.9955 4.35808 19.9863 4.33579C19.977 4.31351 19.9635 4.29326 19.9465 4.2762C19.9294 4.25915 19.9092 4.24563 19.8869 4.23641C19.8646 4.2272 19.8407 4.22247 19.8166 4.2225H19.625Z" fill="currentColor" />
      </g>
      <defs>
        <clipPath id="windsurf">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  `,
  gemini: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g clip-path="url(#gemini)">
        <path d="M20 10.0195C14.6289 10.3477 10.3477 14.6289 10.0195 20H9.98047C9.65234 14.6289 5.37109 10.3477 0 10.0195V9.98047C5.37109 9.65234 9.65234 5.37109 9.98047 0H10.0195C10.3477 5.37109 14.6289 9.65234 20 9.98047V10.0195Z" fill="currentColor" />
      </g>
      <defs>
        <clipPath id="gemini">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  `,
  codex: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g clip-path="url(#codex)">
        <path d="M18.5681 8.18423C18.7917 7.51079 18.8691 6.79739 18.795 6.09168C18.7209 5.38596 18.497 4.70419 18.1384 4.0919C17.6067 3.16642 16.7948 2.43369 15.8199 1.99936C14.8449 1.56503 13.7572 1.45153 12.7135 1.67523C12.1206 1.0157 11.3646 0.523789 10.5214 0.248906C9.67823 -0.0259764 8.77756 -0.0741542 7.90986 0.109212C7.04216 0.292578 6.23798 0.701031 5.57809 1.29355C4.91821 1.88607 4.42584 2.64179 4.15046 3.48481C3.45518 3.62739 2.79834 3.91672 2.22384 4.33347C1.64933 4.75023 1.1704 5.28481 0.81904 5.90148C0.281569 6.82542 0.0518576 7.89634 0.163116 8.95943C0.274374 10.0225 0.720837 11.0227 1.43796 11.8153C1.21351 12.4884 1.13539 13.2017 1.20883 13.9074C1.28227 14.6132 1.50557 15.2951 1.86379 15.9076C2.39616 16.8334 3.20872 17.5663 4.18438 18.0006C5.16004 18.4349 6.2484 18.5483 7.29262 18.3243C7.76367 18.8548 8.34248 19.2786 8.99038 19.5676C9.63828 19.8566 10.3404 20.004 11.0498 20C12.1195 20.001 13.1618 19.662 14.0263 19.0321C14.8909 18.4021 15.5329 17.5137 15.8596 16.4951C16.5548 16.3523 17.2116 16.0629 17.786 15.6461C18.3605 15.2294 18.8395 14.6949 19.191 14.0784C19.7222 13.1558 19.9479 12.0889 19.836 11.0303C19.7242 9.97163 19.2804 8.9754 18.5681 8.18423ZM11.0498 18.691C10.1737 18.6924 9.32512 18.3853 8.65279 17.8236L8.77104 17.7566L12.753 15.4581C12.8521 15.4 12.9343 15.3171 12.9917 15.2176C13.0491 15.118 13.0796 15.0053 13.0802 14.8904V9.27631L14.7635 10.2501C14.7719 10.2544 14.7791 10.2605 14.7846 10.268C14.7901 10.2755 14.7937 10.2843 14.7952 10.2935V14.9456C14.7931 15.9383 14.3978 16.8898 13.6959 17.5917C12.9939 18.2936 12.0425 18.6889 11.0498 18.691ZM2.99921 15.2531C2.55985 14.4945 2.4021 13.6052 2.55371 12.7417L2.67204 12.8127L6.65787 15.1112C6.7565 15.1691 6.86877 15.1996 6.98312 15.1996C7.09747 15.1996 7.20975 15.1691 7.30837 15.1112L12.1774 12.3041V14.2478C12.1769 14.2579 12.1742 14.2677 12.1694 14.2766C12.1646 14.2855 12.1579 14.2932 12.1497 14.2991L8.11654 16.6251C7.25581 17.121 6.2335 17.255 5.27405 16.9978C4.3146 16.7405 3.49644 16.1131 2.99921 15.2531ZM1.95054 6.57965C2.39294 5.81612 3.09123 5.23375 3.92179 4.93565V9.66665C3.92029 9.78094 3.94949 9.89355 4.00635 9.99271C4.06321 10.0919 4.14564 10.174 4.24504 10.2304L9.09037 13.0256L7.40696 13.9994C7.39785 14.0042 7.38769 14.0068 7.37737 14.0068C7.36706 14.0068 7.3569 14.0042 7.34779 13.9994L3.32254 11.6773C2.46343 11.1793 1.83666 10.3612 1.57951 9.40204C1.32236 8.44291 1.45577 7.42095 1.95054 6.55998V6.57965ZM15.7808 9.79281L10.9197 6.96998L12.5992 5.99998C12.6083 5.99514 12.6185 5.99261 12.6288 5.99261C12.6391 5.99261 12.6493 5.99514 12.6584 5.99998L16.6836 8.32606C17.2991 8.68119 17.8008 9.20407 18.1303 9.83365C18.4597 10.4632 18.6032 11.1735 18.5441 11.8816C18.485 12.5898 18.2257 13.2664 17.7964 13.8327C17.3672 14.3989 16.7857 14.8314 16.1199 15.0796V10.3486C16.1164 10.2345 16.0833 10.1232 16.0238 10.0258C15.9644 9.92833 15.8807 9.8481 15.7808 9.79281ZM17.4564 7.27356L17.338 7.20256L13.3601 4.8844C13.2609 4.82617 13.1479 4.79547 13.0329 4.79547C12.9178 4.79547 12.8049 4.82617 12.7056 4.8844L7.84071 7.6914V5.74781C7.83967 5.73793 7.84132 5.72795 7.84549 5.71893C7.84965 5.70991 7.85618 5.70218 7.86437 5.69656L11.8896 3.3744C12.5065 3.01899 13.2119 2.84659 13.9232 2.87736C14.6345 2.90813 15.3224 3.14079 15.9063 3.54813C16.4903 3.95548 16.9461 4.52066 17.2206 5.17759C17.4952 5.83452 17.577 6.55602 17.4565 7.25773L17.4564 7.27356ZM6.92196 10.7191L5.23862 9.74931C5.2302 9.74424 5.223 9.73738 5.21753 9.72921C5.21205 9.72105 5.20845 9.71178 5.20696 9.70206V5.06181C5.20788 4.34996 5.41144 3.65308 5.79383 3.05265C6.17622 2.45222 6.72164 1.97305 7.36632 1.67118C8.011 1.3693 8.7283 1.2572 9.43434 1.34796C10.1404 1.43873 10.806 1.72861 11.3534 2.18373L11.235 2.25081L7.25321 4.54915C7.1541 4.60727 7.07182 4.69017 7.01445 4.78971C6.95707 4.88925 6.92658 5.00201 6.92596 5.1169L6.92196 10.7191ZM7.83662 8.74798L10.005 7.49815L12.1774 8.74798V11.2475L10.0129 12.4972L7.84062 11.2475L7.83662 8.74798Z" fill="currentColor" />
      </g>
      <defs>
        <clipPath id="codex">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  `,
};

const styles = String.raw`
  :root {
    color-scheme: dark;
    --brand-white: #f7f7f7;
    --brand-neutral-50: #dbdbdb;
    --brand-neutral-100: #a8a8a8;
    --brand-neutral-200: #757575;
    --brand-neutral-300: #595959;
    --brand-neutral-400: #424242;
    --brand-neutral-500: #262626;
    --brand-neutral-600: #171717;
    --brand-black: #000000;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    min-height: 100vh;
    background: #050505;
    color: var(--brand-white);
    font-family: "Geist Sans", "Inter", "SF Pro Display", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 20px;
  }

  .section {
    grid-column: 1 / -1;
    padding: 2rem 0;
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 20px;
  }

  .section-content {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  @media (min-width: 1024px) {
    .section-content {
      grid-column: 2 / span 9;
    }
  }

  .section-header {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 1rem;
    width: 100%;
  }

  .display {
    grid-column: span 12;
    font-size: clamp(2rem, 3.5vw, 3rem);
    line-height: 1.1;
    letter-spacing: -0.05em;
    font-weight: 500;
    margin: 0;
  }

  .heading-2 {
    grid-column: span 12;
    font-size: clamp(1.75rem, 3vw, 2.5rem);
    line-height: 1.2;
    letter-spacing: -0.03em;
    font-weight: 500;
    margin: 0;
  }

  .text-gradient {
    background: linear-gradient(
      270deg,
      rgba(247, 247, 247, 0.8) 0%,
      #f7f7f7 50%,
      rgba(247, 247, 247, 0.8) 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .lead {
    grid-column: span 12;
    font-size: 1.125rem;
    color: var(--brand-white);
    max-width: 650px;
    margin: 0;
    line-height: 1.6;
  }

  .body-text {
    grid-column: span 12;
    color: var(--brand-neutral-100);
    font-size: 1rem;
    line-height: 1.7;
    margin: 0;
    max-width: 650px;
  }

  .connection-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 12px;
    width: 100%;
    margin-top: 1rem;
  }

  .connection-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 1rem;
    min-height: 60px;
    border: 1px solid var(--brand-neutral-600);
    background: rgba(5, 5, 5, 0.85);
    padding: 1.25rem 1.5rem;
    border-radius: 2px;
    color: var(--brand-white);
    font-size: 1rem;
    font-weight: 500;
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.2s ease, background 0.2s ease;
  }

  .connection-card:hover,
  .connection-card:focus-visible {
    border-color: var(--brand-neutral-400);
    background: rgba(15, 15, 15, 0.85);
  }

  .connection-card:focus-visible {
    outline: 2px solid var(--brand-white);
    outline-offset: 3px;
  }

  .icon-badge {
    width: 48px;
    height: 48px;
    border: 1px dashed var(--brand-neutral-400);
    border-radius: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--brand-neutral-600);
    flex-shrink: 0;
  }

  .icon-badge svg {
    width: 24px;
    height: 24px;
    color: var(--brand-white);
  }

  .background-icon {
    position: absolute;
    inset: 0;
    pointer-events: none;
    color: var(--brand-neutral-600);
  }

  .background-icon svg {
    position: absolute;
    width: 120px;
    height: auto;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: currentColor;
  }

  .card-label {
    position: relative;
    z-index: 2;
    color: var(--brand-white);
  }

  .code-block {
    position: relative;
    width: 100%;
    margin-top: 1.25rem;
  }

  .code-block pre {
    margin: 0;
    border-radius: 0;
    border: 1px solid var(--brand-neutral-500);
    background: rgba(8, 8, 8, 0.9);
    padding: 1.5rem;
    overflow-x: auto;
  }

  .code-block code {
    font-family: "Geist Mono", "SFMono-Regular", "Consolas", monospace;
    color: var(--brand-white);
    font-size: 0.85rem;
    line-height: 1.6;
    display: block;
    white-space: pre;
  }

  .copy-snippet-btn {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border: none;
    background: rgba(0, 0, 0, 0.8);
    color: var(--brand-neutral-50);
    border-radius: 0;
    cursor: pointer;
    transition: color 0.2s ease, background 0.2s ease;
    z-index: 10;
  }

  .copy-snippet-btn:hover,
  .copy-snippet-btn:focus-visible {
    color: var(--brand-white);
    background: rgba(0, 0, 0, 0.95);
    outline: none;
  }

  .copy-snippet-btn svg {
    width: 16px;
    height: 16px;
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .copy-snippet-btn svg.hidden {
    opacity: 0;
    transform: scale(0.8);
  }

  .copy-snippet-btn svg.visible {
    opacity: 1;
    transform: scale(1);
  }

  .card-inner {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
  }

  .toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: rgba(8, 8, 8, 0.95);
    border: 1px solid var(--brand-neutral-500);
    border-radius: 0;
    padding: 0.75rem 1.25rem;
    font-size: 0.9rem;
    color: var(--brand-white);
    opacity: 0;
    transform: translateY(12px) scale(0.98);
    transition: opacity 0.3s ease, transform 0.3s ease;
    pointer-events: none;
  }

  .toast.show {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }
`;

const createClientScript = (
  endpoint: string,
  serverName: string | undefined,
  serverDescription: string | undefined
) => `
  (() => {
    const templateConfig = ${JSON.stringify({
      endpoint,
      serverName: serverName ?? null,
      serverDescription: serverDescription ?? null,
    })};

    const elements = {
      name: document.getElementById("server-name"),
      description: document.getElementById("server-description"),
      grid: document.getElementById("connection-grid"),
      remoteSnippet: document.getElementById("remote-snippet"),
      copyRemoteButton: document.getElementById("copy-remote-snippet"),
      copyIcon: document.getElementById("copy-icon"),
      checkIcon: document.getElementById("check-icon"),
      toast: document.getElementById("toast"),
    };

    const resolvedName =
      (templateConfig.serverName && templateConfig.serverName.trim()) || "xmcp server";
    const resolvedDescription =
      (templateConfig.serverDescription && templateConfig.serverDescription.trim()) ||
      "${FALLBACK_DESCRIPTION}";
    const endpointPath =
      (templateConfig.endpoint && templateConfig.endpoint.trim()) || "/";
    const normalizedEndpoint = endpointPath.startsWith("/")
      ? endpointPath
      : \`/\${endpointPath}\`;
    const origin = window.location.origin.replace(/\\/$/, "");
    const serverUrl = origin + normalizedEndpoint;
    const identifier =
      resolvedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "xmcp-server";

    if (elements.name) {
      elements.name.textContent = resolvedName;
    }

    if (elements.description) {
      elements.description.textContent = resolvedDescription;
    }

    const icons = ${JSON.stringify(ICONS)};

    const connectionOptions = [
      {
        label: "Cursor",
        type: "copy",
        snippet: \`{
    "\${identifier}": {
      "url": "\${serverUrl}"
    }
  }\`,
        description: "Copy Cursor connection config",
        icon: "cursor",
      },
      {
        label: "Claude Code",
        type: "copy",
        snippet: \`claude mcp add --transport http "\${identifier}" \\\\\\n    "\${serverUrl}"\`,
        description: "Copy CLI snippet for Claude Code",
        icon: "claude",
      },
      {
        label: "Claude Desktop",
        type: "copy",
        snippet: \`{
    "\${identifier}": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "\${serverUrl}"]
    }
  }\`,
        description: "Copy Claude Desktop setup command",
        icon: "claude",
      },
      {
        label: "Windsurf",
        type: "copy",
        snippet: \`"\${identifier}": {
  "command": "npx",
  "args": [
    "mcp-remote",
    "\${serverUrl}"
  ]
}\`,
        description: "Copy Windsurf attach command",
        icon: "windsurf",
      },
      {
        label: "Gemini CLI",
        type: "copy",
        snippet: \`gemini mcp add --transport http "\${identifier}" "\${serverUrl}"\`,
        description: "Copy Gemini CLI link command",
        icon: "gemini",
      },
      {
        label: "Codex",
        type: "copy",
        snippet: \`[mcp_servers.\${identifier}]
command = "npx"
args = ["-y", "mcp-remote", "\${serverUrl}"]\`,
        description: "Copy Codex connect command",
        icon: "codex",
      },
    ];

    if (elements.remoteSnippet) {
      const remoteSnippet = JSON.stringify(
        {
          command: "npx",
          args: ["mcp-remote", serverUrl],
        },
        null,
        2
      );
      elements.remoteSnippet.textContent = remoteSnippet;
    }

    if (elements.copyRemoteButton) {
      elements.copyRemoteButton.addEventListener("click", () => {
        const snippet = elements.remoteSnippet?.textContent || "";
        copyText(snippet)
          .then((success) => {
            if (success) {
              // Animate icon change
              if (elements.copyIcon && elements.checkIcon) {
                elements.copyIcon.classList.remove("visible");
                elements.copyIcon.classList.add("hidden");
                elements.checkIcon.classList.remove("hidden");
                elements.checkIcon.classList.add("visible");

                // Reset after 2 seconds
                setTimeout(() => {
                  elements.copyIcon?.classList.remove("hidden");
                  elements.copyIcon?.classList.add("visible");
                  elements.checkIcon?.classList.remove("visible");
                  elements.checkIcon?.classList.add("hidden");
                }, 2000);
              }
            } else {
              showToast("Unable to copy. Please copy manually.");
            }
          })
          .catch(() => {
            showToast("Unable to copy. Please copy manually.");
          });
      });
    }

    if (elements.grid) {
      elements.grid.innerHTML = "";
      connectionOptions.forEach((option) => {
        const isCopy = option.type === "copy";
        const card = document.createElement(isCopy ? "button" : "a");
        card.className = "connection-card";
        if (isCopy) {
          card.type = "button";
        } else {
          card.href = option.href;
          card.target = "_blank";
          card.rel = "noreferrer";
        }

        const inner = document.createElement("span");
        inner.className = "card-inner";

        const iconBadge = document.createElement("span");
        iconBadge.className = "icon-badge";
        iconBadge.innerHTML = icons[option.icon] || "";

        const label = document.createElement("span");
        label.className = "card-label";
        label.textContent = option.label;

        inner.appendChild(iconBadge);
        inner.appendChild(label);
        card.appendChild(inner);

        const backgroundIcon = document.createElement("span");
        backgroundIcon.className = "background-icon";
        backgroundIcon.innerHTML = icons[option.icon] || "";
        card.appendChild(backgroundIcon);

        if (isCopy) {
          card.addEventListener("click", () => {
            copyText(option.snippet)
              .then((success) => {
                showToast(
                  success
                    ? \`\${option.label} connection method copied to clipboard.\`
                    : "Unable to copy. Please copy manually."
                );
              })
              .catch(() => {
                showToast("Unable to copy. Please copy manually.");
              });
          });
        }

        elements.grid?.appendChild(card);
      });
    }

    function showToast(message) {
      if (!elements.toast) return;
      elements.toast.textContent = message;
      elements.toast.classList.add("show");
      setTimeout(() => {
        elements.toast && elements.toast.classList.remove("show");
      }, 2400);
    }

    async function copyText(text) {
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch (error) {
          return fallbackCopy(text);
        }
      }
      return fallbackCopy(text);
    }

    function fallbackCopy(text) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textarea);
        return successful;
      } catch {
        return false;
      }
    }
  })();
`;

const homeTemplate = (
  endpoint: string,
  serverName: string | undefined,
  serverDescription: string | undefined
) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${serverName || "xmcp server"}</title>
    <link
      rel="preconnect"
      href="https://fonts.googleapis.com"
    />
    <link
      rel="preconnect"
      href="https://fonts.gstatic.com"
      crossorigin
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Geist+Sans:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
    <style>
${styles}
    </style>
  </head>
  <body>
    <main class="template-layout">
      <section class="section">
        <div class="section-content">
          <div class="section-header">
            <h2 id="server-name" class="display text-gradient">xmcp server</h2>
            <p id="server-description" class="lead">
              ${serverDescription || FALLBACK_DESCRIPTION}
            </p>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-content">
          <div class="section-header">
            <h2 class="heading-2 text-gradient">Connect to a client</h2>
            <p class="body-text">
              Select your preferred way to connect to your MCP server.
            </p>
          </div>
          <div id="connection-grid" class="connection-grid" aria-live="polite"></div>
        </div>
      </section>

      <section class="section">
        <div class="section-content">
          <div class="section-header">
            <h2 class="heading-2 text-gradient">Standard connection</h2>
            <p class="body-text">
              For clients not listed above, you can use the following connection method.
            </p>
          </div>
          <div class="code-block">
            <button
              type="button"
              class="copy-snippet-btn"
              id="copy-remote-snippet"
              aria-label="Copy standard connection method"
            >
              <span class="sr-only">Copy standard connection method</span>
              <svg
                id="copy-icon"
                class="visible"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <rect
                  x="5.25"
                  y="3"
                  width="7.5"
                  height="9.5"
                  rx="1"
                  stroke="currentColor"
                  stroke-width="1.25"
                />
                <path
                  d="M3.25 10.75V2.75H9.75"
                  stroke="currentColor"
                  stroke-width="1.25"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <svg
                id="check-icon"
                class="hidden"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                style="position: absolute;"
              >
                <path
                  d="M13.5 4L6 11.5L2.5 8"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
        </svg>
            </button>
            <pre><code id="remote-snippet"></code></pre>
          </div>
    </div>
      </section>
    </main>
    <div id="toast" class="toast" role="status" aria-live="polite"></div>
    <script>
${createClientScript(endpoint, serverName, serverDescription)}
    </script>
  </body>
</html>
`;

export default homeTemplate;
