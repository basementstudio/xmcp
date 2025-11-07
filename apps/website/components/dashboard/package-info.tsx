import { Card, CardContent } from '@/components/ui/card';
import { FileTextIcon, ScaleIcon, PackageIcon, CalendarIcon, UserIcon } from 'lucide-react';
import { format } from 'date-fns';

interface Repository {
  type: string;
  url: string;
  directory?: string;
}

interface Maintainer {
  name?: string;
  email?: string;
  username?: string;
}

interface PackageInfoProps {
  name: string;
  description?: string;
  latestVersion: string;
  license?: string;
  repository?: Repository | string;
  homepage?: string;
  keywords?: string[];
  lastPublished?: string;
  unpackedSize?: number;
  versionsCount: number;
  maintainers?: Maintainer[];
}

export function PackageInfo({
  license,
  lastPublished,
  unpackedSize,
  versionsCount,
  maintainers,
}: PackageInfoProps) {
  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Generate Gravatar URL from email
  const getMaintainerAvatar = (email?: string): string => {
    if (!email) return `https://www.gravatar.com/avatar/00000000000000000000000000000000?s=40&d=retro`;
    
    // Normalize email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim();
    
    // Generate MD5 hash
    const hash = md5(normalizedEmail);
    
    return `https://www.gravatar.com/avatar/${hash}?s=40&d=retro`;
  };

  // MD5 hash implementation for browser
  const md5 = (str: string): string => {
    // Simple MD5 implementation for client-side
    function rotateLeft(value: number, shift: number): number {
      return (value << shift) | (value >>> (32 - shift));
    }

    function addUnsigned(x: number, y: number): number {
      const lsw = (x & 0xFFFF) + (y & 0xFFFF);
      const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
      return (msw << 16) | (lsw & 0xFFFF);
    }

    function f(x: number, y: number, z: number): number {
      return (x & y) | (~x & z);
    }

    function g(x: number, y: number, z: number): number {
      return (x & z) | (y & ~z);
    }

    function h(x: number, y: number, z: number): number {
      return x ^ y ^ z;
    }

    function i(x: number, y: number, z: number): number {
      return y ^ (x | ~z);
    }

    function ff(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
      a = addUnsigned(a, addUnsigned(addUnsigned(f(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }

    function gg(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
      a = addUnsigned(a, addUnsigned(addUnsigned(g(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }

    function hh(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
      a = addUnsigned(a, addUnsigned(addUnsigned(h(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }

    function ii(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
      a = addUnsigned(a, addUnsigned(addUnsigned(i(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }

    function convertToWordArray(str: string): number[] {
      const wordArray: number[] = [];
      const asciiLength = str.length;
      
      for (let i = 0; i < asciiLength; i++) {
        wordArray[i >> 2] |= (str.charCodeAt(i) & 0xFF) << ((i % 4) * 8);
      }
      
      return wordArray;
    }

    function wordToHex(value: number): string {
      let hex = '';
      for (let i = 0; i < 4; i++) {
        const byte = (value >>> (i * 8)) & 0xFF;
        hex += byte.toString(16).padStart(2, '0');
      }
      return hex;
    }

    const x = convertToWordArray(str);
    const len = str.length * 8;

    x[len >> 5] |= 0x80 << (len % 32);
    x[(((len + 64) >>> 9) << 4) + 14] = len;

    let a = 0x67452301;
    let b = 0xEFCDAB89;
    let c = 0x98BADCFE;
    let d = 0x10325476;

    const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
    const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
    const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
    const S41 = 6, S42 = 10, S43 = 15, S44 = 21;

    for (let k = 0; k < x.length; k += 16) {
      const AA = a, BB = b, CC = c, DD = d;

      a = ff(a, b, c, d, x[k + 0], S11, 0xD76AA478);
      d = ff(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
      c = ff(c, d, a, b, x[k + 2], S13, 0x242070DB);
      b = ff(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
      a = ff(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
      d = ff(d, a, b, c, x[k + 5], S12, 0x4787C62A);
      c = ff(c, d, a, b, x[k + 6], S13, 0xA8304613);
      b = ff(b, c, d, a, x[k + 7], S14, 0xFD469501);
      a = ff(a, b, c, d, x[k + 8], S11, 0x698098D8);
      d = ff(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
      c = ff(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
      b = ff(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
      a = ff(a, b, c, d, x[k + 12], S11, 0x6B901122);
      d = ff(d, a, b, c, x[k + 13], S12, 0xFD987193);
      c = ff(c, d, a, b, x[k + 14], S13, 0xA679438E);
      b = ff(b, c, d, a, x[k + 15], S14, 0x49B40821);

      a = gg(a, b, c, d, x[k + 1], S21, 0xF61E2562);
      d = gg(d, a, b, c, x[k + 6], S22, 0xC040B340);
      c = gg(c, d, a, b, x[k + 11], S23, 0x265E5A51);
      b = gg(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
      a = gg(a, b, c, d, x[k + 5], S21, 0xD62F105D);
      d = gg(d, a, b, c, x[k + 10], S22, 0x02441453);
      c = gg(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
      b = gg(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
      a = gg(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
      d = gg(d, a, b, c, x[k + 14], S22, 0xC33707D6);
      c = gg(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
      b = gg(b, c, d, a, x[k + 8], S24, 0x455A14ED);
      a = gg(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
      d = gg(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
      c = gg(c, d, a, b, x[k + 7], S23, 0x676F02D9);
      b = gg(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);

      a = hh(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
      d = hh(d, a, b, c, x[k + 8], S32, 0x8771F681);
      c = hh(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
      b = hh(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
      a = hh(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
      d = hh(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
      c = hh(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
      b = hh(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
      a = hh(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
      d = hh(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
      c = hh(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
      b = hh(b, c, d, a, x[k + 6], S34, 0x04881D05);
      a = hh(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
      d = hh(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
      c = hh(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
      b = hh(b, c, d, a, x[k + 2], S34, 0xC4AC5665);

      a = ii(a, b, c, d, x[k + 0], S41, 0xF4292244);
      d = ii(d, a, b, c, x[k + 7], S42, 0x432AFF97);
      c = ii(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
      b = ii(b, c, d, a, x[k + 5], S44, 0xFC93A039);
      a = ii(a, b, c, d, x[k + 12], S41, 0x655B59C3);
      d = ii(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
      c = ii(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
      b = ii(b, c, d, a, x[k + 1], S44, 0x85845DD1);
      a = ii(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
      d = ii(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
      c = ii(c, d, a, b, x[k + 6], S43, 0xA3014314);
      b = ii(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
      a = ii(a, b, c, d, x[k + 4], S41, 0xF7537E82);
      d = ii(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
      c = ii(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
      b = ii(b, c, d, a, x[k + 9], S44, 0xEB86D391);

      a = addUnsigned(a, AA);
      b = addUnsigned(b, BB);
      c = addUnsigned(c, CC);
      d = addUnsigned(d, DD);
    }

    return wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
  };

  return (
    <Card className='border-none shadow-none p-0'>
      <CardContent className="space-y-6 p-0">
        {/* Package Stats */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <ScaleIcon className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">License</p>
              <p className="text-sm text-muted-foreground">{license || 'Not specified'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PackageIcon className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Package Size</p>
              <p className="text-sm text-muted-foreground">{formatBytes(unpackedSize)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Last Published</p>
              <p className="text-sm text-muted-foreground">
                {lastPublished ? format(new Date(lastPublished), 'MMM dd, yyyy') : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FileTextIcon className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Total Versions</p>
              <p className="text-sm text-muted-foreground">{versionsCount}</p>
            </div>
          </div>

          {/* Maintainers as part of stats grid */}
          {maintainers && maintainers.length > 0 && (
            <div className="flex items-start gap-2 sm:col-span-2">
              <UserIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">Maintainers</p>
                <div className="flex flex-wrap gap-2">
                  {maintainers.map((maintainer, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 rounded-md border border-border bg-muted px-2 py-1 text-xs"
                    >
                      <img
                        src={getMaintainerAvatar(maintainer.email)}
                        alt={maintainer.name || maintainer.username || 'Maintainer'}
                        className="w-6 h-6 rounded-full"
                        loading="lazy"
                      />
                      <span>{maintainer.name || maintainer.username || maintainer.email || 'Unknown'}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        
      </CardContent>
    </Card>
  );
}
