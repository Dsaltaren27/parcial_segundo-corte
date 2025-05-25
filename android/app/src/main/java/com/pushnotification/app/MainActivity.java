package com.pushnotification.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import org.jitsi.meet.sdk.BroadcastAction;
import org.jitsi.meet.sdk.BroadcastEvent;
import org.jitsi.meet.sdk.JitsiMeet;
import org.jitsi.meet.sdk.JitsiMeetActivity;
import org.jitsi.meet.sdk.JitsiMeetConferenceOptions;
import java.net.URL;
import java.util.ArrayList;

public class MainActivity extends AppCompatActivity {

    // BroadcastReceiver para manejar eventos de Jitsi
    private final BroadcastReceiver broadcastReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            BroadcastEvent event = new BroadcastEvent(intent);
            if (event.getType() == BroadcastEvent.Type.CONFERENCE_JOINED) {
                System.out.println("Se ha unido a la conferencia: " + event.getData().get("url"));
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            // Configuración del servidor Jitsi
            URL serverURL = new URL("https://meet.jit.si");

            // Configuración de botones personalizados
            ArrayList<Bundle> customToolbarButtons = new ArrayList<>();

            Bundle firstCustomButton = new Bundle();
            firstCustomButton.putString("text", "Button one");
            firstCustomButton.putString("icon", "https://w7.pngwing.com/pngs/987/537/png-transparent-download-downloading-save-basic-user-interface-icon-thumbnail.png");
            firstCustomButton.putString("id", "btn1");

            Bundle secondCustomButton = new Bundle();
            secondCustomButton.putString("text", "Button two");
            secondCustomButton.putString("icon", "https://w7.pngwing.com/pngs/987/537/png-transparent-download-downloading-save-basic-user-interface-icon-thumbnail.png");
            secondCustomButton.putString("id", "btn2");

            customToolbarButtons.add(firstCustomButton);
            customToolbarButtons.add(secondCustomButton);

            // Configuración global de Jitsi Meet
            JitsiMeetConferenceOptions defaultOptions = new JitsiMeetConferenceOptions.Builder()
                .setServerURL(serverURL)
                .setFeatureFlag("welcomepage.enabled", false)
                .setConfigOverride("requireDisplayName", true)
                .setConfigOverride("customToolbarButtons", String.valueOf(customToolbarButtons))
                .build();

            JitsiMeet.setDefaultConferenceOptions(defaultOptions);

            // Configuración específica de la conferencia
            JitsiMeetConferenceOptions options = new JitsiMeetConferenceOptions.Builder()
                .setRoom("MonthlyEndorsementsRebuildConsequently")
                .setAudioMuted(false)
                .setVideoMuted(false)
                .setAudioOnly(false)
                .build();

            // Registrar el BroadcastReceiver para escuchar eventos
            IntentFilter intentFilter = new IntentFilter();
            intentFilter.addAction("org.jitsi.meet.CONFERENCE_JOINED");
            LocalBroadcastManager.getInstance(this).registerReceiver(broadcastReceiver, intentFilter);

            // Iniciar Jitsi Meet
            JitsiMeetActivity.launch(this, options);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        LocalBroadcastManager.getInstance(this).unregisterReceiver(broadcastReceiver);
    }

    // Método para mutear/desmutear el audio en Jitsi Meet
    public void setAudioMuted(boolean muted) {
        Intent muteBroadcastIntent = new Intent("org.jitsi.meet.SET_AUDIO_MUTED");
        muteBroadcastIntent.putExtra("muted", muted);
        LocalBroadcastManager.getInstance(getApplicationContext()).sendBroadcast(muteBroadcastIntent);
    }
}
