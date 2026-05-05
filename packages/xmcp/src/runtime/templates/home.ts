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
  plug: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M7 2v4" />
      <path d="M13 2v4" />
      <path d="M5 6h10v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5V6z" fill="none" />
      <path d="M10 14v4" />
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
    background: #000000;
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

  html,
  body {
    background-color: #000000;
  }

  body {
    margin: 0;
    min-height: 100vh;
    color: var(--brand-white);
    font-family: "Geist Sans", "Inter", "SF Pro Display", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
  }


  a {
    color: inherit;
    text-decoration: none;
  }

  main {
    max-width: 1440px;
    margin: 0 auto;
    padding: 2rem 2rem 4rem;
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 24px;
  }

  .section {
    grid-column: 1 / -1;
    padding: 0;
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
    background: #000000;
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
    background: #000000;
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
    background: transparent;
    flex-shrink: 0;
  }

  .icon-badge svg {
    width: 24px;
    height: 24px;
    color: var(--brand-white);
  }

  .toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #000000;
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

  .hero {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }

  .hero-top {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .hero-icon {
    width: 64px;
    height: 64px;
    flex-shrink: 0;
    align-self: baseline;
  }

  .hero-icon img,
  .hero-icon svg {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .hero-top .display {
    margin: 0;
  }

  .hero-top .meta-pill {
    margin-left: auto;
  }

  .hero-bottom {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .hero-bottom .lead {
    margin: 0;
    flex: 1;
    min-width: 0;
  }

  .hero-bottom .actions-row {
    display: contents;
  }

  .hero-bottom .dropdown {
    margin-left: auto;
  }

  .meta-pill {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.5rem;
    border: 1px dashed var(--brand-neutral-400);
    background: transparent;
    color: var(--brand-neutral-100);
    font-family: "Geist Mono", "SFMono-Regular", "Consolas", monospace;
    font-size: 0.75rem;
    border-radius: 0;
  }

  .actions-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  .action-btn {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-width: 120px;
    height: 36px;
    padding: 0 0.75rem;
    border: 1px solid var(--brand-white);
    background: transparent;
    color: var(--brand-white);
    font-family: inherit;
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1;
    border-radius: 2px;
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  .action-btn:hover,
  .action-btn:focus-visible {
    background: rgba(255, 255, 255, 0.1);
    outline: none;
  }

  .action-btn svg {
    width: 18px;
    height: 18px;
  }

  .action-btn--primary {
    background: var(--brand-white);
    color: var(--brand-black);
    border-color: var(--brand-white);
  }

  .action-btn--primary:hover,
  .action-btn--primary:focus-visible {
    background: rgba(255, 255, 255, 0.9);
  }

  .action-btn--primary svg,
  .action-btn--primary svg * {
    stroke: var(--brand-black);
  }

  .dropdown {
    position: relative;
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    min-width: 260px;
    border: 1px solid var(--brand-neutral-500);
    background: #000000;
    padding: 6px;
    z-index: 20;
    display: none;
    flex-direction: column;
    gap: 2px;
  }

  .dropdown[data-open="true"] .dropdown-menu {
    display: flex;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.65rem 0.75rem;
    border: none;
    background: transparent;
    color: var(--brand-white);
    font-family: inherit;
    font-size: 0.9rem;
    text-align: left;
    cursor: pointer;
    border-radius: 2px;
  }

  .dropdown-item:hover,
  .dropdown-item:focus-visible {
    background: var(--brand-neutral-600);
    outline: none;
  }

  .dropdown-item .icon-badge {
    width: 32px;
    height: 32px;
  }

  .dropdown-item .icon-badge svg {
    width: 18px;
    height: 18px;
  }

  .tabs {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid var(--brand-neutral-500);
    margin-bottom: 1rem;
  }

  .tab {
    appearance: none;
    border: none;
    background: transparent;
    color: var(--brand-neutral-100);
    font-family: inherit;
    font-size: 0.95rem;
    font-weight: 500;
    padding: 0.6rem 1rem;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: color 0.2s ease, border-color 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .tab:hover {
    color: var(--brand-white);
  }

  .tab[aria-selected="true"] {
    color: var(--brand-white);
    border-bottom-color: var(--brand-white);
  }

  .tab-panel[hidden] {
    display: none;
  }

  .capability-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
    min-height: 0;
    padding: 1rem 1.25rem;
    cursor: default;
  }

  .capability-card {
    border: 1px solid var(--brand-neutral-600);
    background: #000000;
    transition: border-color 0.2s ease;
  }

  .capability-card:hover {
    border-color: var(--brand-neutral-400);
  }

  .capability-name {
    font-family: "Geist Mono", "SFMono-Regular", "Consolas", monospace;
    font-size: 0.9rem;
    color: var(--brand-white);
    word-break: break-word;
  }

  .capability-desc {
    font-size: 0.85rem;
    color: var(--brand-neutral-100);
    line-height: 1.5;
    margin: 0;
  }

  .capability-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: 0.25rem;
  }

  .capability-badge {
    font-size: 0.625rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 0.25rem 0.5rem;
    border: 1px dashed var(--brand-neutral-400);
    background: transparent;
    color: var(--brand-neutral-100);
    border-radius: 0;
  }

  .capability-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    width: 100%;
  }

  @media (min-width: 640px) {
    .capability-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (min-width: 960px) {
    .capability-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  .pagination {
    display: none;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .pagination[data-active="true"] {
    display: flex;
  }

  .pagination-btn {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    min-width: 32px;
    padding: 0 0.6rem;
    border: 1px solid var(--brand-neutral-400);
    background: transparent;
    color: var(--brand-white);
    font-family: inherit;
    font-size: 0.85rem;
    line-height: 1;
    border-radius: 2px;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease;
  }

  .pagination-btn:hover:not([disabled]),
  .pagination-btn:focus-visible:not([disabled]) {
    background: rgba(255, 255, 255, 0.08);
    outline: none;
  }

  .pagination-btn[disabled] {
    color: var(--brand-neutral-300);
    border-color: var(--brand-neutral-500);
    cursor: not-allowed;
  }

  .pagination-indicator {
    font-family: "Geist Mono", "SFMono-Regular", "Consolas", monospace;
    font-size: 0.75rem;
    color: var(--brand-neutral-100);
    padding: 0.25rem 0.5rem;
    border: 1px dashed var(--brand-neutral-400);
    background: transparent;
  }

  .capability-card[hidden] {
    display: none;
  }
`;

const createClientScript = (
  endpoint: string,
  serverName: string | undefined
) => `
  (() => {
    const templateConfig = ${JSON.stringify({
      endpoint,
      serverName: serverName ?? null,
    })};

    const toast = document.getElementById("toast");
    const dropdown = document.getElementById("connect-dropdown");
    const trigger = document.getElementById("connect-trigger");
    const menu = document.getElementById("connect-menu");
    const getUrlButton = document.getElementById("get-url-btn");

    const resolvedName =
      (templateConfig.serverName && templateConfig.serverName.trim()) || "xmcp server";
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

    const icons = ${JSON.stringify(ICONS)};

    const connectionOptions = [
      {
        label: "Cursor",
        snippet: \`{
    "\${identifier}": {
      "url": "\${serverUrl}"
    }
  }\`,
        icon: "cursor",
      },
      {
        label: "Claude Code",
        snippet: \`claude mcp add --transport http "\${identifier}" \\\\\\n    "\${serverUrl}"\`,
        icon: "claude",
      },
      {
        label: "Claude Desktop",
        snippet: \`{
    "\${identifier}": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "\${serverUrl}"]
    }
  }\`,
        icon: "claude",
      },
      {
        label: "Windsurf",
        snippet: \`"\${identifier}": {
  "command": "npx",
  "args": [
    "mcp-remote",
    "\${serverUrl}"
  ]
}\`,
        icon: "windsurf",
      },
      {
        label: "Gemini CLI",
        snippet: \`gemini mcp add --transport http "\${identifier}" "\${serverUrl}"\`,
        icon: "gemini",
      },
      {
        label: "Codex",
        snippet: \`[mcp_servers.\${identifier}]
command = "npx"
args = ["-y", "mcp-remote", "\${serverUrl}"]\`,
        icon: "codex",
      },
      {
        label: "Standard",
        snippet: JSON.stringify(
          { command: "npx", args: ["mcp-remote", serverUrl] },
          null,
          2
        ),
        icon: "plug",
      },
    ];

    function setDropdownOpen(open) {
      if (!dropdown || !trigger) return;
      dropdown.dataset.open = open ? "true" : "false";
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
    }

    if (menu) {
      connectionOptions.forEach((option) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "dropdown-item";
        item.setAttribute("role", "menuitem");

        const iconBadge = document.createElement("span");
        iconBadge.className = "icon-badge";
        iconBadge.setAttribute("aria-hidden", "true");
        iconBadge.innerHTML = (option.icon && icons[option.icon]) || "";

        const label = document.createElement("span");
        label.textContent = option.label;

        item.appendChild(iconBadge);
        item.appendChild(label);

        item.addEventListener("click", async () => {
          setDropdownOpen(false);
          const success = await copyText(option.snippet);
          showToast(
            success
              ? \`\${option.label} snippet copied to clipboard.\`
              : "Unable to copy. Please copy manually."
          );
        });

        menu.appendChild(item);
      });
    }

    if (trigger) {
      trigger.addEventListener("click", (event) => {
        event.stopPropagation();
        const isOpen = dropdown?.dataset.open === "true";
        setDropdownOpen(!isOpen);
      });
    }

    document.addEventListener("click", (event) => {
      if (!dropdown) return;
      if (!dropdown.contains(event.target)) setDropdownOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setDropdownOpen(false);
    });

    if (getUrlButton) {
      getUrlButton.addEventListener("click", async () => {
        const success = await copyText(serverUrl);
        showToast(
          success
            ? "MCP URL copied to clipboard."
            : "Unable to copy. Please copy manually."
        );
      });
    }

    const tabs = Array.from(document.querySelectorAll("[data-tab]"));
    const panels = Array.from(document.querySelectorAll("[data-panel]"));

    const paginationState = new Map();

    function applyPagination(grid, pageIndex) {
      const pageSize = parseInt(grid.getAttribute("data-page-size") || "9", 10);
      const cards = Array.from(grid.children);
      const totalPages = Math.max(1, Math.ceil(cards.length / pageSize));
      const clamped = Math.min(Math.max(pageIndex, 0), totalPages - 1);
      const start = clamped * pageSize;
      const end = start + pageSize;

      cards.forEach((card, i) => {
        if (i >= start && i < end) {
          card.removeAttribute("hidden");
        } else {
          card.setAttribute("hidden", "");
        }
      });

      const panel = grid.closest("[data-panel]");
      const panelId = panel?.getAttribute("data-panel");
      if (!panelId) return clamped;

      const pager = document.querySelector(
        '[data-pagination-for="' + panelId + '"]'
      );
      if (!pager) return clamped;

      const needsPager = cards.length > pageSize;
      pager.dataset.active = needsPager ? "true" : "false";

      if (needsPager) {
        const indicator = pager.querySelector("[data-page-indicator]");
        const prev = pager.querySelector("[data-page-prev]");
        const next = pager.querySelector("[data-page-next]");
        if (indicator) indicator.textContent = (clamped + 1) + " / " + totalPages;
        if (prev) prev.toggleAttribute("disabled", clamped === 0);
        if (next) next.toggleAttribute("disabled", clamped >= totalPages - 1);
      }

      return clamped;
    }

    function renderPanelPagination(panelId, pageIndex) {
      const panel = document.querySelector('[data-panel="' + panelId + '"]');
      if (!panel) return;
      const grid = panel.querySelector("[data-paginate]");
      if (!grid) return;
      const next = applyPagination(grid, pageIndex ?? paginationState.get(panelId) ?? 0);
      paginationState.set(panelId, next);
    }

    document.querySelectorAll("[data-pagination-for]").forEach((pager) => {
      const panelId = pager.getAttribute("data-pagination-for");
      if (!panelId) return;
      const prev = pager.querySelector("[data-page-prev]");
      const next = pager.querySelector("[data-page-next]");
      prev?.addEventListener("click", () => {
        renderPanelPagination(panelId, (paginationState.get(panelId) ?? 0) - 1);
      });
      next?.addEventListener("click", () => {
        renderPanelPagination(panelId, (paginationState.get(panelId) ?? 0) + 1);
      });
    });

    panels.forEach((panel) => {
      const id = panel.getAttribute("data-panel");
      if (id) renderPanelPagination(id, 0);
    });

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.getAttribute("data-tab");
        tabs.forEach((t) =>
          t.setAttribute(
            "aria-selected",
            t.getAttribute("data-tab") === target ? "true" : "false"
          )
        );
        panels.forEach((panel) => {
          if (panel.getAttribute("data-panel") === target) {
            panel.removeAttribute("hidden");
          } else {
            panel.setAttribute("hidden", "");
          }
        });
        if (target) renderPanelPagination(target, 0);
      });
    });

    // Long enough to read a short copy-confirmation, short enough to not linger.
    const TOAST_VISIBLE_MS = 2400;

    function showToast(message) {
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), TOAST_VISIBLE_MS);
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

export type HomeIcon = {
  src: string;
  mimeType?: string;
};

export type HomeToolEntry = {
  name: string;
  description?: string;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
};

export type HomePromptEntry = {
  name: string;
  title?: string;
  description?: string;
};

export type HomeResourceEntry = {
  name: string;
  title?: string;
  description?: string;
  mimeType?: string;
};

export type HomeServerMeta = {
  version?: string;
  icons?: HomeIcon[];
  instructions?: string;
  tools?: HomeToolEntry[];
  prompts?: HomePromptEntry[];
  resources?: HomeResourceEntry[];
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderToolBadges = (
  annotations: HomeToolEntry["annotations"]
): string => {
  if (!annotations) return "";
  const labels: string[] = [];
  if (annotations.readOnlyHint) labels.push("read-only");
  if (annotations.destructiveHint) labels.push("destructive");
  if (annotations.idempotentHint) labels.push("idempotent");
  if (annotations.openWorldHint) labels.push("open-world");
  if (labels.length === 0) return "";
  return `<div class="capability-badges">${labels
    .map((label) => `<span class="capability-badge">${escapeHtml(label)}</span>`)
    .join("")}</div>`;
};

const renderCapabilityCard = (
  name: string,
  description: string | undefined,
  badges: string
): string => `
            <div class="connection-card capability-card">
              <span class="capability-name">${escapeHtml(name)}</span>
              ${
                description
                  ? `<p class="capability-desc">${escapeHtml(description)}</p>`
                  : ""
              }
              ${badges}
            </div>`;

const renderCapabilitySection = (
  heading: string,
  copy: string,
  cards: string[]
): string => {
  if (cards.length === 0) return "";
  return `
      <section class="section">
        <div class="section-content">
          <div class="section-header">
            <h2 class="heading-2 text-gradient">${escapeHtml(heading)}</h2>
            <p class="body-text">${escapeHtml(copy)}</p>
          </div>
          <div class="connection-grid">${cards.join("")}</div>
        </div>
      </section>`;
};

const renderHero = (
  serverName: string | undefined,
  serverDescription: string | undefined,
  meta: HomeServerMeta
): string => {
  const icon = meta.icons?.[0];
  const iconHtml = icon
    ? `<span class="hero-icon" aria-hidden="true"><img src="${escapeHtml(
        icon.src
      )}" alt="" /></span>`
    : "";
  const versionHtml = meta.version
    ? `<span class="meta-pill">v${escapeHtml(meta.version)}</span>`
    : "";

  return `
      <section class="section">
        <div class="section-content">
          <div class="hero">
            <div class="hero-top">
              ${iconHtml}
              <h2 id="server-name" class="display text-gradient">${escapeHtml(
                serverName || "xmcp server"
              )}</h2>
              ${versionHtml}
            </div>
            <div class="hero-bottom">
              <p id="server-description" class="lead">${escapeHtml(
                serverDescription || FALLBACK_DESCRIPTION
              )}</p>
              ${renderActions()}
            </div>
          </div>
        </div>
      </section>`;
};

const renderInstructions = (meta: HomeServerMeta): string => {
  const instructions = meta.instructions?.trim();
  if (!instructions) return "";
  return `
      <section class="section">
        <div class="section-content">
          <p class="body-text">${escapeHtml(instructions)}</p>
        </div>
      </section>`;
};

const COPY_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="5.25" y="3" width="7.5" height="9.5" rx="1" stroke="currentColor" stroke-width="1.25" /><path d="M3.25 10.75V2.75H9.75" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" /></svg>`;

const CHEVRON_SVG = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" /></svg>`;

const TAB_ICONS: Record<string, string> = {
  tools: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0-.83-.83-2.17 0-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91"/></svg>`,
  prompts: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  resources: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`,
};

const renderActions = (): string => `
                <div class="actions-row">
                  <div class="dropdown" id="connect-dropdown" data-open="false">
                    <button
                      type="button"
                      class="action-btn"
                      id="connect-trigger"
                      aria-haspopup="menu"
                      aria-expanded="false"
                    >
                      <span>Connect to</span>
                      ${CHEVRON_SVG}
                    </button>
                    <div
                      class="dropdown-menu"
                      id="connect-menu"
                      role="menu"
                      aria-labelledby="connect-trigger"
                    ></div>
                  </div>
                  <button type="button" class="action-btn action-btn--primary" id="get-url-btn">
                    ${COPY_ICON_SVG}
                    <span>Get MCP URL</span>
                  </button>
                </div>`;

const renderCapabilities = (meta: HomeServerMeta): string => {
  const toolsCards = (meta.tools ?? []).map((tool) =>
    renderCapabilityCard(
      tool.name,
      tool.description,
      renderToolBadges(tool.annotations)
    )
  );
  const promptsCards = (meta.prompts ?? []).map((prompt) =>
    renderCapabilityCard(
      prompt.name,
      prompt.description ?? prompt.title,
      ""
    )
  );
  const resourcesCards = (meta.resources ?? []).map((resource) =>
    renderCapabilityCard(
      resource.name,
      resource.description ?? resource.title,
      resource.mimeType
        ? `<div class="capability-badges"><span class="capability-badge">${escapeHtml(
            resource.mimeType
          )}</span></div>`
        : ""
    )
  );

  const panels: { id: string; label: string; cards: string[] }[] = [
    { id: "tools", label: "Tools", cards: toolsCards },
    { id: "prompts", label: "Prompts", cards: promptsCards },
    { id: "resources", label: "Resources", cards: resourcesCards },
  ].filter((p) => p.cards.length > 0);

  if (panels.length === 0) return "";

  const tabs = panels
    .map(
      (panel, index) =>
        `<button
              type="button"
              class="tab"
              role="tab"
              data-tab="${panel.id}"
              aria-selected="${index === 0 ? "true" : "false"}"
            >${TAB_ICONS[panel.id] ?? ""}<span>${escapeHtml(panel.label)}</span><span class="capability-badge">${panel.cards.length}</span></button>`
    )
    .join("");

  const panelHtml = panels
    .map(
      (panel, index) => `
            <div
              class="tab-panel"
              role="tabpanel"
              data-panel="${panel.id}"
              ${index === 0 ? "" : "hidden"}
            >
              <div class="capability-grid" data-paginate data-page-size="9">${panel.cards.join("")}</div>
              <div class="pagination" data-pagination-for="${panel.id}" role="navigation" aria-label="${escapeHtml(panel.label)} pagination">
                <button type="button" class="pagination-btn" data-page-prev aria-label="Previous page">Prev</button>
                <span class="pagination-indicator" data-page-indicator>1 / 1</span>
                <button type="button" class="pagination-btn" data-page-next aria-label="Next page">Next</button>
              </div>
            </div>`
    )
    .join("");

  return `
      <section class="section">
        <div class="section-content">
          <div class="tabs" role="tablist">${tabs}</div>${panelHtml}
        </div>
      </section>`;
};

const homeTemplate = (
  endpoint: string,
  serverName: string | undefined,
  serverDescription: string | undefined,
  serverMeta: HomeServerMeta = {}
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
${renderHero(serverName, serverDescription, serverMeta)}
${renderInstructions(serverMeta)}
${renderCapabilities(serverMeta)}
    </main>
    <div id="toast" class="toast" role="status" aria-live="polite"></div>
    <script>
${createClientScript(endpoint, serverName)}
    </script>
  </body>
</html>
`;

export default homeTemplate;
