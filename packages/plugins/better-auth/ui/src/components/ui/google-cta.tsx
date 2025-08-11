import React from "react";
import { authClient } from "../auth-client";

interface GoogleButtonProps {
  setError: (error: string | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const GoogleButton: React.FC<GoogleButtonProps> = ({
  setError,
  isLoading,
  setIsLoading,
}) => {
  const handleSignIn = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/callback/google",
      });
      if (error) {
        setError(
          error.message || "Failed to sign in with Google. Please try again."
        );
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignIn}
      disabled={isLoading}
      className="w-full bg-white text-black py-3 px-4 font-medium hover:bg-gray-100 focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm uppercase"
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Signing In...
        </span>
      ) : (
        <>
          <svg
            width="17"
            height="17"
            viewBox="0 0 17 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_1070_33)">
              <path
                d="M6.07386 1.32593C4.47522 1.88052 3.09654 2.93314 2.14035 4.32918C1.18416 5.72523 0.700854 7.39111 0.761418 9.08214C0.821982 10.7732 1.42323 12.4002 2.47684 13.7243C3.53045 15.0483 4.98089 15.9996 6.61511 16.4384C7.94002 16.7803 9.32813 16.7953 10.6601 16.4822C11.8668 16.2111 12.9823 15.6314 13.8976 14.7997C14.8502 13.9076 15.5417 12.7728 15.8976 11.5172C16.2845 10.1518 16.3534 8.71585 16.0989 7.31968H8.65886V10.4059H12.9676C12.8815 10.8982 12.697 11.368 12.4251 11.7872C12.1531 12.2065 11.7994 12.5666 11.3851 12.8459C10.859 13.194 10.2659 13.4281 9.64387 13.5334C9.02005 13.6494 8.38019 13.6494 7.75636 13.5334C7.1241 13.4027 6.52599 13.1418 6.00011 12.7672C5.1553 12.1692 4.52096 11.3196 4.18762 10.3397C3.84863 9.34142 3.84863 8.25919 4.18762 7.26093C4.4249 6.5612 4.81716 5.9241 5.33511 5.39718C5.92785 4.78311 6.67828 4.34418 7.50406 4.12853C8.32984 3.91287 9.19906 3.92884 10.0164 4.17468C10.6548 4.37067 11.2387 4.7131 11.7214 5.17468C12.2072 4.69135 12.6922 4.20676 13.1764 3.72093C13.4264 3.45968 13.6989 3.21093 13.9451 2.94343C13.2083 2.25778 12.3435 1.72425 11.4001 1.37343C9.68225 0.749668 7.80259 0.732905 6.07386 1.32593Z"
                fill="black"
              />
              <path
                d="M6.07397 1.32605C7.80254 0.732621 9.6822 0.748942 11.4002 1.3723C12.3437 1.7255 13.2082 2.2616 13.944 2.9498C13.694 3.2173 13.4302 3.4673 13.1752 3.7273C12.6902 4.21147 12.2056 4.69397 11.7215 5.1748C11.2388 4.71322 10.6549 4.37079 10.0165 4.1748C9.19943 3.9281 8.33024 3.91121 7.50424 4.12598C6.67824 4.34075 5.92735 4.77888 5.33396 5.3923C4.81601 5.91922 4.42375 6.55632 4.18646 7.25605L1.59521 5.2498C2.52273 3.4105 4.12865 2.00358 6.07397 1.32605Z"
                fill="#E33629"
              />
              <path
                d="M0.907438 7.2375C1.04671 6.54724 1.27794 5.87878 1.59494 5.25L4.18619 7.26125C3.84721 8.25951 3.84721 9.34174 4.18619 10.34C3.32285 11.0067 2.4591 11.6767 1.59494 12.35C0.801376 10.7704 0.559354 8.97063 0.907438 7.2375Z"
                fill="#F8BD00"
              />
              <path
                d="M8.65876 7.31836H16.0988C16.3533 8.71453 16.2844 10.1504 15.8975 11.5159C15.5416 12.7715 14.8501 13.9063 13.8975 14.7984C13.0613 14.1459 12.2213 13.4984 11.385 12.8459C11.7996 12.5662 12.1535 12.2057 12.4254 11.786C12.6973 11.3663 12.8817 10.896 12.9675 10.4034H8.65876C8.65751 9.37586 8.65876 8.34711 8.65876 7.31836Z"
                fill="#587DBD"
              />
              <path
                d="M1.59375 12.3498C2.45792 11.6832 3.32167 11.0132 4.185 10.3398C4.51901 11.3201 5.15426 12.1697 6 12.7673C6.52751 13.1402 7.12691 13.399 7.76 13.5273C8.38382 13.6433 9.02368 13.6433 9.6475 13.5273C10.2695 13.4221 10.8626 13.1879 11.3888 12.8398C12.225 13.4923 13.065 14.1398 13.9012 14.7923C12.9861 15.6245 11.8705 16.2047 10.6637 16.4761C9.33176 16.7892 7.94365 16.7742 6.61875 16.4323C5.57088 16.1526 4.59209 15.6593 3.74375 14.9836C2.84583 14.2707 2.11244 13.3723 1.59375 12.3498Z"
                fill="#319F43"
              />
            </g>
            <defs>
              <clipPath id="clip0_1070_33">
                <rect
                  width="16"
                  height="16"
                  fill="white"
                  transform="translate(0.5 0.799805)"
                />
              </clipPath>
            </defs>
          </svg>
          Continue with Google
        </>
      )}
    </button>
  );
};
