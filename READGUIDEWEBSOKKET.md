Tài liệu này được thiết kế theo chuẩn Reactive Programming (RxJS) của Angular, đảm bảo tính mở rộng (scalable), dễ bảo trì (maintainable) và hoàn toàn khớp với kiến trúc Backend (Spring Boot + Redis + STOMP) hiện tại của hệ thống.

TÀI LIỆU BÀN GIAO FRONTEND (ANGULAR) - TÍCH HỢP WEBSOCKET 
Hệ thống: Scalable Notification System (Hệ thống Thông báo Phân tán)
Tài liệu này được thiết kế theo tiêu chuẩn Reactive Programming (RxJS) của Angular, đảm bảo tính mở rộng cao (scalable), dễ bảo trì (maintainable) và đồng bộ tuyệt đối với cụm Backend Spring Boot, Redis Pub/Sub và Message Broker Kafka hiện tại của dự án.

1. Tổng quan Kiến trúc & Luồng dữ liệu (Data Flow)
Hệ thống vận hành theo mô hình kiến trúc hướng sự kiện (Event-Driven Architecture) phi tập trung để tối ưu hóa hiệu năng:
Bộ điều hợp Gateway (notificationservice): Chạy ở cổng 8087, module này chịu trách nhiệm duy trì kết nối WebSocket vật lý với các Client, lắng nghe sự kiện từ RAM Redis và ngay lập tức "bắc cầu" (Bridge) để phát quảng bá xuống Frontend qua STOMP Broker Topics.
Handshake Endpoint: http://localhost:8087/ws-notification




2. ĐẶC TẢ CHI TIẾT CÁC WEBSOCKET TOPICS (PUBLIC STOMP)
Phía Frontend ứng dụng (Angular/React/HTML5) kết nối vào WebSocket Endpoint: ws://localhost:8087/ws-notification (Hỗ trợ SockJS Fallback) và tiến hành đăng ký lắng nghe (Subscribe) các kênh dữ liệu sau:
2.1.Bảng cấu hình các STOMP Topics Quản trị
Tên WebSocket Topic (Destination)
Định dạng Dữ liệu nhận được (Payload Schema)
Ý nghĩa chức năng nghiệp vụ hệ thống
/topic/campaigns
Chuỗi ký tự thô (Plain Text String)

VD: "5:ACTIVE" hoặc "12:COMPLETED"
Giám sát và cập nhật trạng thái vòng đời tổng quan của một chiến dịch thông báo hàng loạt khi chạy nền.
/topic/notifications
Đối tượng JSON phức hợp (CREATE/UPDATE Action)

VD: Xem cấu trúc chi tiết mục 2
Thác nước đổ trạng thái dữ liệu (Live Streaming): Cập nhật trạng thái tức thời cho từng thông báo đơn lẻ của người dùng.
/topic/activities
Đối tượng JSON nguyên bản (Operational Log)

VD: {"message": "Admin Lam khởi chạy campaign mới", "timestamp": 1779128543000}
Broadcast luồng nhật ký vận hành trực tiếp lên màn hình Dashboard quản trị tổng quan của hệ thống.





2.2. Đặc tả chi tiết Payload kênh /topic/campaigns 
Ví dụ file FE HTML: test-ws.html trong Notification_BE
http://localhost:8087/test-ws.html
Luồng trạng thái chiến dịch (/topic/campaigns): Server trả về định dạng chuỗi phân tách bởi dấu hai chấm: "{campaignId}:{status}".
ACTIVE: Chiến dịch đang được bộ đặt lịch Scheduler bốc dỡ dữ liệu và đẩy vào hàng đợi.
COMPLETED: Toàn bộ tệp khách hàng của chiến dịch đã được chuyển hóa sang trạng thái xử lý thành công.
EXPIRED: Chiến dịch bị quá hạn mốc thời gian cấu hình kết thúc (endTime).
2.3. Kênh sự kiện Thông báo chi tiết (Notification Stream)
Kênh này dùng để cập nhật trạng thái của từng dòng thông báo chi tiết (bảng Log hoặc danh sách của App người dùng).
Topic: /topic/notifications
Kiểu dữ liệu nhận được: JSON Object
Cấu trúc Payload:
Server sẽ gửi thông tin cập nhật mỗi khi một tin nhắn thay đổi trạng thái (từ lúc chờ gửi đến lúc có kết quả).
{
  "action": "UPDATE", // Hoặc "CREATE" cho tin nhắn mới
  "data": {
    "id": 1692,
    "campaignId": 388,
    "userId": "101",
    "userName": "Nguyễn Văn A",
    "channel": "push",
    "status": "failed", // pending, sent, failed
    "title": "Thông báo khuyến mãi",
    "body": "Nội dung tin nhắn...",
    "sentAt": "2024-05-20T10:30:00",
    "errorMessage": "Invalid FCM Token", // Chỉ có khi status là 'failed'
    "count": 1
  }
}
Khi ấn retry nếu noti bị failed nó sẽ trả về errorMessage kèm noti qua topic/campaigns

Ví dụ file FE HTML: test-ws.html trong Notification_BE
Kênh dữ liệu này truyền tải cấu trúc bao bọc gói tin động gồm hai trường chính: action (Trạng thái vòng đời giao diện) và data (Nội dung chi tiết ánh xạ DTO nghiệp vụ):

2.4.Giao thức JSON cấu hình ngoài (Wrapper Schema)
JSON
{
  "action": "CREATE | UPDATE",
  "data": { ... }
}

CREATE: Khi hệ thống tiếp nhận một thông báo mới chạy ở trạng thái hàng đợi (Pending). Frontend chèn dòng mới này lên đầu bảng hiển thị (Hiệu ứng thác nước đổ ngược).
UPDATE: Khi Worker gửi tin thành công hoặc thất bại (sent / failed). Frontend tìm dòng có ID tương ứng để cập nhật động các Badge trạng thái mà không cần vẽ lại toàn bộ bảng (Idempotent Render).
Chi tiết cấu trúc lõi data (
{
  "id": 2045,
  "userId": "15",
  "userName": "111",
  "channel": "PUSH | EMAIL | SMS",
  "status": "PENDING | SENT | FAILED",
  "title": "Mã OTP xác thực tài khoản",
  "body": "Mã OTP của bạn là 4592. Vui lòng không chia sẻ mã này cho bất kỳ ai.",
  "sentAt": [2026, 5, 19, 1, 48, 23, 521000000],
  "isRead": false,
  "isDeleted": false,
  "count": 1
}


2.5. Hoạt động gần đây
File HTML FE thử recent activity: dashboard-activity.html Notification_BE
http://localhost:8087/dashboard-activity.html
Để đảm bảo hiệu năng và tính toàn vẹn dữ liệu cho Dashboard của Admin, luồng hoạt động được thiết kế đóng gói vòng lặp giới hạn nghiêm ngặt ở mốc 4 hoạt động mới nhất (MAX_ACTIVITIES = 4):
Giai đoạn Cold-Start (REST API Fetch): Khi trang vừa được tải hoặc F5, client gửi yêu cầu GET đến AdminActivityController chặng ngắn để bốc dữ liệu lịch sử hoạt động đã lưu tĩnh trong bộ nhớ RAM (Redis) phục vụ render giao diện ngay lập tức.
Giai đoạn Live-Stream (STOMP Subscription): Sau khi phục hồi xong, client duy trì kết nối WebSocket lắng nghe topic /topic/activities. Bất kỳ khi nào một Admin khác thực thi tác vụ (e.g., Tạo Campaign, Bắn Retry), hạt tin sẽ được broadcast thời gian thực xuống để cập nhật UI.



2.5.2 ĐẶC TẢ CHI TIẾT ĐẦU MÚT GIAO TIẾP (SPECS)
1. Luồng HTTP REST (Khôi phục trạng thái tĩnh khi F5)
Luồng này gọi duy nhất một lần khi khởi tạo component giao diện nhằm lấy dữ liệu tĩnh.
Endpoint: /api/admin/campaigns/activities/recent
Phương thức: GET
Headers bắt buộc:
Authorization: Bearer {ADMIN_JWT_TOKEN}
Content-Type: application/json
Ví dụ Payload phản hồi từ Server (Response JSON Array)
JSON
[
  {
    "type": "CREATE_CAMPAIGN",
    "message": "Admin Lam đã khởi tạo chiến dịch 'Khuyến mãi Hè 2026'",
    "timestamp": 1779128543000
  },
  {
    "type": "RETRY_NOTI",
    "message": "Hệ thống tự động kích hoạt luồng Retry cho thông báo #2045",
    "timestamp": 1779128512000
  }
]

2.5.3. Luồng STOMP WebSocket (Live Broadcast)
Client thực hiện đăng ký lắng nghe (Subscribe) biến động trực chiến chặng dài.
WebSocket Connection Endpoint: ws://localhost:8087/ws-notification
STOMP Destination Topic: /topic/activities
Định dạng dữ liệu nhận được: Một đối tượng JSON phẳng (chứa bản tin hoạt ứng đơn chiếc).
Cấu trúc JSON Lõi (Activity Payload Schema)
Tên trường (Property)
Kiểu dữ liệu
Ý nghĩa chức năng nghiệp vụ
type
String
Mã phân loại hoạt động (Dùng để FE sinh Icon/Badge màu sắc tương ứng).
message
String
Chuỗi nội dung mô tả chi tiết hoạt động vừa diễn ra trên hệ thống.
timestamp
Number
Thời gian Unix Epoch (Millisecond) dùng để tính toán bộ đếm thời gian trôi qua



2.6. Kênh sự kiện Chiến dịch (Campaign Dashboard)
Kênh này dùng để cập nhật trạng thái chung và số lượng thống kê (Sent, Failed, Pending) của từng chiến dịch trên trang danh sách.
Topic: /topic/campaigns
Kiểu dữ liệu nhận được: JSON Object
Cấu trúc Payload:
Khi có sự thay đổi về số lượng tin nhắn (một tin vừa gửi thành công hoặc thất bại), Server sẽ broadcast gói tin sau:
{
  "action": "UPDATE_CAMPAIGN_STATS",
  "campaignId": 388,
  "data": {
    "id": "388",
    "name": "Chiến dịch khuyến mãi hè",
    "status": "ACTIVE",
    "totalTarget": 100,
    "sentStatus": {
      "sent": 45,
      "failed": 5,
      "pending": 50
    },
    "scheduledTime": "2024-05-20T10:00:00",
    "endTime": "2024-05-20T22:00:00"
  }
}
Hướng dẫn xử lý cho Angular:
Lắng nghe topic /topic/campaigns.
Kiểm tra action === 'UPDATE_CAMPAIGN_STATS'.
Tìm bản ghi chiến dịch trong mảng dữ liệu hiện tại có id khớp với data.id.
Cập nhật đè object sentStatus để số lượng trên UI nhảy số realtime.




3. Hướng dẫn cài đặt thư viện (Setup)
Giải pháp tối ưu nhất để bọc kết nối STOMP thành các RxJS Observables an toàn trong Angular là sử dụng thư viện @stomp/rx-stomp kết hợp với sockjs-client.
Chạy lệnh cài đặt trực tiếp tại thư mục gốc của dự án Angular:
npm install @stomp/rx-stomp sockjs-client
npm install @types/sockjs-client --save-dev


4. Triển khai mã nguồn mẫu tại Frontend (Ví dụ)
Bước 1: Khởi tạo File cấu hình kết nối (rx-stomp.config.ts)
Tạo file tại thư mục src/app/config/rx-stomp.config.ts để quản lý thông số handshake thông qua SockJS factory:
TypeScript
import { RxStompConfig } from '@stomp/rx-stomp';
import SockJS from 'sockjs-client';

export const myRxStompConfig: RxStompConfig = {
  // Đồng bộ cấu hình kết nối trực tiếp qua API Gateway cổng 8087
  webSocketFactory: () => {
    return new SockJS('http://localhost:8087/ws-notification');
  },

  // Giữ kết nối mạng luôn sống (Heartbeat tính bằng mili-giây)
  heartbeatIncoming: 0,
  heartbeatOutgoing: 20000,

  // Tự động kích hoạt cơ chế reconnection sau 5 giây nếu rớt mạng hoặc sập cụm BE
  reconnectDelay: 5000,

  // Bật debug để theo dõi các khung tin STOMP luân chuyển ở môi trường Dev
  debug: (msg: string): void => {
    console.log(new Date(), msg);
  }
};

Bước 2: Xây dựng Singleton Service điều phối (notification-ws.service.ts)
Tạo Service tại src/app/services/notification-ws.service.ts để expose các Observable sạch cho các Component sử dụng:
TypeScript
import { Injectable, OnDestroy } from '@angular/core';
import { RxStomp } from '@stomp/rx-stomp';
import { map, Observable } from 'rxjs';
import { myRxStompConfig } from '../config/rx-stomp.config';

@Injectable({
  providedIn: 'root'
})
export class NotificationWsService implements OnDestroy {
  private rxStomp: RxStomp;

  constructor() {
    this.rxStomp = new RxStomp();
    this.rxStomp.configure(myRxStompConfig);
    // Kích hoạt đường truyền kết nối STOMP Broker ngay khi Angular khởi động ứng dụng
    this.rxStomp.activate();
  }

  /**
   * Lắng nghe sự kiện hệ thống của Chiến dịch hàng loạt
   * @returns Observable phát chuỗi: "EXPIRED", "{id}:ACTIVE", "{id}:COMPLETED"
   */
  public watchCampaignEvents(): Observable<string> {
    return this.rxStomp.watch('/topic/campaigns').pipe(
      map(message => message.body)
    );
  }
  }

  /**
   * (YÊU CẦU 5) Lắng nghe thay đổi trạng thái thời gian thực của từng thông báo đơn lẻ
   * @returns Observable phát chuỗi cấu trúc phẳng: "{notificationId}:{status}"
   */
  public watchNotificationStatusChange(): Observable<string> {
    return this.rxStomp.watch('/topic/notifications').pipe(
      map(message => message.body)
    );
  }

  /**
   * Dọn dẹp tài nguyên hệ thống, ngắt kết nối an toàn khi đóng ứng dụng
   */
  ngOnDestroy(): void {
    this.rxStomp.deactivate();
  }
}


Bước 3: Đăng ký hiển thị động trên Giao diện thành phần (Components)
Ví dụ 1: Áp dụng cho màn hình quản trị chiến dịch của Admin (campaign-dashboard.component.ts)
Xử lý sự kiện ACTIVE (đang xử lý) và COMPLETED (hoàn thành) kết hợp kỹ thuật băm gói tin tối ưu hiệu năng Change Detection:
TypeScript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { bufferTime } from 'rxjs/operators';
import { NotificationWsService } from '../../services/notification-ws.service';

@Component({
  selector: 'app-campaign-dashboard',
  template: `
    <div class="campaign-monitor">
      <h3>Bảng điều khiển chiến dịch thời gian thực</h3>
      
      <div class="status-panel">
        Tiến độ hàng đợi Kafka hiện tại: <strong>{{ queuedTargetsCount }}</strong> tin nhắn.
      </div>

      <ul class="log-view">
        <li *ngFor="let log of dashboardLogs">[{{ log.time }}] {{ log.text }}</li>
      </ul>
    </div>
  `
})
export class CampaignDashboardComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription = new Subscription();
  public dashboardLogs: { time: string; text: string }[] = [];
  public queuedTargetsCount: number = 0;

  constructor(private wsService: NotificationWsService) {}

  ngOnInit(): void {
    // 1. Lắng nghe luồng sự kiện vòng đời chiến dịch (Active, Completed, Expired)
    this.subscriptions.add(
      this.wsService.watchCampaignEvents().subscribe({
        next: (eventStr: string) => {
          this.pushLog(`CAMPAIGN EVENT: ${eventStr}`);
          
          if (eventStr === 'MASS_EXPIRED') {
            this.refreshCampaignTableData(); // Gọi hàm fetch lại bảng REST API
          } else if (eventStr.includes(':ACTIVE')) {
            const campaignId = eventStr.split(':')[0];
            this.updateCampaignStatusOnUI(campaignId, 'PROCESSING'); // Đổi UI sang trạng thái "Đang chạy"
          } else if (eventStr.includes(':COMPLETED')) {
            const campaignId = eventStr.split(':')[0];
            this.updateCampaignStatusOnUI(campaignId, 'COMPLETED'); // Đổi UI sang trạng thái "Hoàn thành"
          }
        }
      })
    );

    // 2. Lắng nghe luồng tiến độ Target (Áp dụng Batching giảm tải cho Browser)
    this.subscriptions.add(
      this.wsService.watchTargetProgress().pipe(
        bufferTime(500) // Gom toàn bộ tin nhắn dội về trong 0.5s thành một mảng
      ).subscribe({
        next: (batchMessages: string[]) => {
          const validEvents = batchMessages.filter(msg => msg && msg.includes(':QUEUED'));
          if (validEvents.length > 0) {
            // Cập nhật số lượng dồn một lượt, ngăn hiện tượng DOM re-render liên tục gây đơ màn hình
            this.queuedTargetsCount += validEvents.length;
            this.pushLog(`BATCH UPDATE: Đã xếp xó thêm ${validEvents.length} bản ghi khách hàng.`);
          }
        }
      })
    );
  }

  private pushLog(msg: string) {
    this.dashboardLogs.unshift({ time: new Date().toLocaleTimeString(), text: msg });
    if (this.dashboardLogs.length > 50) this.dashboardLogs.pop();
  }

  private updateCampaignStatusOnUI(id: string, status: string) {
    console.log(`Cập nhật trạng thái Campaign #${id} trên màn hình thành: ${status}`);
  }

  private refreshCampaignTableData() {
    console.log('Thực hiện tải lại dữ liệu mới nhất từ cơ sở dữ liệu qua REST...');
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe(); // Hủy toàn bộ lắng nghe để tránh Memory Leak
  }
}

Ví dụ 2: Áp dụng cập nhật trạng thái tin nhắn đơn lẻ cho User (notification-list.component.ts)
Xử lý đồng bộ hiển thị trạng thái pending, sent, failed của bản ghi thông báo:
TypeScript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationWsService } from '../../services/notification-ws.service';

@Component({
  selector: 'app-notification-list',
  template: `
    <div class="noti-box">
      <h3>Hộp thư tháo báo cá nhân</h3>
      <div *ngFor="let item of myNotifications" class="noti-row" [ngClass]="item.status">
        <p>Bản tin: <b>#{{ item.id }}</b> | Trạng thái: <span class="badge">{{ item.status | uppercase }}</span></p>
        <p class="content">{{ item.message }}</p>
      </div>
    </div>
  `
})
export class NotificationListComponent implements OnInit, OnDestroy {
  private subscription: Subscription = new Subscription();

  // Mảng lưu trữ trạng thái hiển thị động cục bộ của Angular Component
  public myNotifications = [
    { id: 2045, message: 'Mã OTP xác thực đăng ký EduQuiz của bạn là: 8991', status: 'pending' },
    { id: 2046, message: 'Tài khoản của bạn vừa được nạp 50.000 VND từ hệ thống', status: 'pending' }
  ];

  constructor(private wsService: NotificationWsService) {}

  ngOnInit(): void {
    // Đăng ký luồng WebSocket đồng bộ trạng thái đơn lẻ từ các Consumer đầu cuối gửi lên
    this.subscription = this.wsService.watchNotificationStatusChange().subscribe({
      next: (payloadStr: string) => {
        // Tách chuỗi theo định dạng chuẩn "id:status" (Ví dụ backend phát: "2045:sent")
        const parts = payloadStr.split(':');
        if (parts.length === 2) {
          const notiId = parseInt(parts[0], 10);
          const newStatus = parts[1]; // 'sent' hoặc 'failed'

          // Định vị vị trí bản tin đang có trên giao diện
          const targetIndex = this.myNotifications.findIndex(n => n.id === notiId);
          if (targetIndex !== -1) {
            // Đổi trạng thái trực tiếp, cơ chế Data Binding của Angular tự động đổi màu sắc đồ họa
            this.myNotifications[targetIndex].status = newStatus;
            console.log(`[REALTIME UPDATE] Thông báo #${notiId} chuyển đổi trạng thái thành -> ${newStatus}`);
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}


4. Giải thích Quyết định Thiết kế (Design Justification)
1. Tại sao dùng @stomp/rx-stomp thay vì stompjs thuần?
Phù hợp kiến trúc Angular: Angular vận hành mạnh mẽ dựa trên RxJS. rx-stomp trả về các Observable, cho phép FE sử dụng toàn bộ các toán tử của RxJS (map, filter, debounceTime, v.v.) để xử lý luồng dữ liệu realtime.
Quản lý kết nối tự động: Thư viện này tự động xử lý việc kết nối lại (reconnect) nếu server Backend bị restart hoặc mạng chập chờn, giúp hệ thống bền bỉ (resilient) hơn.
Tránh Memory Leak: Bằng cách gói các kết nối vào Subscription và gọi .unsubscribe() trong ngOnDestroy(), FE đảm bảo không bị rò rỉ bộ nhớ khi user chuyển qua lại giữa các màn hình (Routing).
2. Khớp hoàn toàn với Backend hiện tại:
Backend định nghĩa registry.addEndpoint("/ws-notification").withSockJS();. Cấu hình FE ở Bước 2 sử dụng đúng SockJS() factory để đảm bảo bắt tay (handshake) thành công qua giao thức HTTP trước khi upgrade lên WebSocket.
Việc parse chuỗi (split(':')) trên FE phản ánh chính xác cấu trúc dữ liệu tiết kiệm băng thông ("{campaignId}:{targetId}:QUEUED") mà class CampaignSchedulerService (thuộc module Scheduler) đang đẩy vào Redis để broadcast.
5. Lưu ý & Troubleshooting (Dành cho FE)
Lỗi net::ERR_CONNECTION_REFUSED: Hãy kiểm tra xem container/ứng dụng notificationservice đã được chạy ở port 8087 chưa.
Lỗi CORS: Mặc dù Backend đã cấu hình setAllowedOriginPatterns("*"), nhưng nếu bị chặn bởi Browser, hãy kiểm tra xem Proxy/Nginx (nếu có) có đang chặn Header Upgrade: websocket hay không.
Dữ liệu nhảy số quá nhanh (Performance UI): Khi một chiến dịch có 1.000.000 user, hàm watchTargetProgress() sẽ nhận được 1.000.000 events. KHÔNG nên dùng cơ chế data binding của Angular (như {{ count }}) trực tiếp cho mỗi event vì sẽ gây treo trình duyệt. Khuyến nghị: Áp dụng toán tử bufferTime(500) của RxJS trong hàm watchTargetProgress để gom batch (VD: cứ nửa giây mới cộng dồn số đếm và render DOM 1 lần).

