export type UiRepository = {
 id:string;name:string;repo:string;url:string;group:'components'|'motion'|'visual';fit:'svelte'|'react'|'framework'|'optional';
 purpose:string;adminControl:string;enabledByDefault:boolean;notes:string;
};
export const uiRepositories:readonly UiRepository[]=[
 {id:'shadcn-ui',name:'shadcn/ui',repo:'shadcn-ui/ui',url:'https://github.com/shadcn-ui/ui',group:'components',fit:'react',purpose:'Bộ component có mã nguồn để tùy biến sâu.',adminControl:'Tham khảo mẫu component; không cài trực tiếp vào SvelteKit.',enabledByDefault:false,notes:'Hệ React. Chỉ port component đã được duyệt sang Svelte.'},
 {id:'tailwindcss',name:'Tailwind CSS',repo:'tailwindlabs/tailwindcss',url:'https://github.com/tailwindlabs/tailwindcss',group:'components',fit:'svelte',purpose:'Utility CSS responsive và token giao diện.',adminControl:'Nền tảng style cho các module tương thích.',enabledByDefault:true,notes:'Tailwind v4 đã có trong Next UI; không nạp CDN trùng lặp.'},
 {id:'daisyui',name:'DaisyUI',repo:'saadeghi/daisyui',url:'https://github.com/saadeghi/daisyui',group:'components',fit:'framework',purpose:'Theme và component dựng nhanh trên Tailwind.',adminControl:'Có thể chọn theme sau khi kiểm tra xung đột CSS.',enabledByDefault:false,notes:'Chưa bật mặc định; cần đánh giá bundle và theme hiện hữu.'},
 {id:'headlessui',name:'Headless UI',repo:'tailwindlabs/headlessui',url:'https://github.com/tailwindlabs/headlessui',group:'components',fit:'react',purpose:'Primitive tương tác có accessibility.',adminControl:'Tham khảo hành vi; port tương đương cho Svelte.',enabledByDefault:false,notes:'Package chính thức tập trung React/Vue, không dùng nguyên xi trong Svelte.'},
 {id:'radix',name:'Radix Primitives',repo:'radix-ui/primitives',url:'https://github.com/radix-ui/primitives',group:'components',fit:'react',purpose:'Primitive dialog, tabs, dropdown có accessibility.',adminControl:'Dùng làm chuẩn hành vi và accessibility khi port.',enabledByDefault:false,notes:'Hệ React; không import trực tiếp vào Svelte.'},
 {id:'motion',name:'Motion (Framer Motion)',repo:'motiondivision/motion',url:'https://github.com/motiondivision/motion',group:'motion',fit:'react',purpose:'Chuyển cảnh và tương tác chuyển động.',adminControl:'Tham khảo choreography; ưu tiên giải pháp tương thích Svelte.',enabledByDefault:false,notes:'Thư viện React. Tắt chuyển động khi prefers-reduced-motion.'},
 {id:'gsap',name:'GSAP',repo:'greensock/GSAP',url:'https://github.com/greensock/GSAP',group:'motion',fit:'framework',purpose:'Timeline và hiệu ứng nâng cao.',adminControl:'Chỉ bật ở trang cần thiết, không áp dụng toàn dashboard.',enabledByDefault:false,notes:'Cần kiểm tra giấy phép, bundle và cleanup lifecycle.'},
 {id:'auto-animate',name:'AutoAnimate',repo:'formkit/auto-animate',url:'https://github.com/formkit/auto-animate',group:'motion',fit:'framework',purpose:'Tự động animate thay đổi danh sách/layout.',adminControl:'Tùy chọn hiệu ứng nhẹ cho danh sách.',enabledByDefault:false,notes:'Kiểm tra adapter Svelte và tôn trọng reduced motion.'},
 {id:'lucide',name:'Lucide',repo:'lucide-icons/lucide',url:'https://github.com/lucide-icons/lucide',group:'visual',fit:'svelte',purpose:'Bộ icon vector đồng nhất.',adminControl:'Chuẩn icon mặc định cho giao diện mới.',enabledByDefault:true,notes:'Dùng package/framework adapter phù hợp; tránh trộn nhiều bộ icon.'},
 {id:'lucide-react',name:'Lucide React',repo:'lucide-icons/lucide',url:'https://github.com/lucide-icons/lucide',group:'visual',fit:'react',purpose:'Adapter icon dành cho React.',adminControl:'Tham khảo tên và hình tượng icon; không cài adapter React vào Svelte.',enabledByDefault:false,notes:'Repository chung Lucide; package lucide-react chỉ dành cho React.'},
 {id:'threejs',name:'Three.js',repo:'mrdoob/three.js',url:'https://github.com/mrdoob/three.js',group:'visual',fit:'optional',purpose:'Đồ họa 3D/WebGL cho trải nghiệm đặc thù.',adminControl:'Chỉ bật ở module chuyên biệt khi có yêu cầu 3D.',enabledByDefault:false,notes:'Không tải vào dashboard mặc định; có thể tăng đáng kể bundle/GPU.'}
] as const;
export const uiRepositoryGroups=[
 {id:'components',label:'Component & UI kits'},
 {id:'motion',label:'Chuyển động & tương tác'},
 {id:'visual',label:'Icon & đồ họa trực quan'}
] as const;
