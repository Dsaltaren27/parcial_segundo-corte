package com.jitcall.app;

import android.annotation.SuppressLint;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

@SuppressLint("MissingFirebaseInstanceTokenRefresh")
public class mycall extends FirebaseMessagingService {

  @Override
  public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
    if (remoteMessage.getNotification() != null) {
      String title = remoteMessage.getNotification().getTitle();
      String body = remoteMessage.getNotification().getBody();
      showCallNotification(title, body);
    }
  }


  private void showCallNotification(String title, String body) {
    Context context = null;
    context = context.getApplicationContext();
    NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
    String channelId = "call_notification_channel";

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      NotificationChannel channel = new NotificationChannel(
        channelId,
        "Call Notifications",
        NotificationManager.IMPORTANCE_HIGH
      );
      channel.setDescription("Notifications for incoming calls");
      channel.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE),
        new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE).build());
      channel.enableVibration(true);
      notificationManager.createNotificationChannel(channel);
    }

    Intent acceptIntent = new Intent(context, NotificationActionReceiver.class);
    acceptIntent.setAction("CALL_ACCEPT");
    PendingIntent acceptPendingIntent = PendingIntent.getBroadcast(context, 0, acceptIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

    Intent rejectIntent = new Intent(context, NotificationActionReceiver.class);
    rejectIntent.setAction("CALL_REJECT");
    PendingIntent rejectPendingIntent = PendingIntent.getBroadcast(context, 1, rejectIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

    NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
      .setSmallIcon(android.R.drawable.ic_dialog_info)
      .setContentTitle(title)
      .setContentText(body)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setCategory(NotificationCompat.CATEGORY_CALL)
      .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE))
      .setVibrate(new long[]{0, 1000, 500, 1000})
      .addAction(android.R.drawable.ic_menu_call, "Aceptar", acceptPendingIntent)
      .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Rechazar", rejectPendingIntent)
      .setFullScreenIntent(acceptPendingIntent, true)
      .setAutoCancel(false)
      .setOngoing(true);

    notificationManager.notify(1001, builder.build());
  }
}
