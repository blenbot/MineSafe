package com.minesafe.modules

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class MineSafePackage : ReactPackage {

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }

    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        val modules = mutableListOf<NativeModule>()
        
        modules.add(ServerApiModule(reactContext))
        modules.add(LocationModule(reactContext))
        modules.add(TensorFlowModule(reactContext))
        modules.add(ScreamDetectionModule(reactContext))
        modules.add(EmergencyModule(reactContext))
        modules.add(OfflineCommModule(reactContext))
        modules.add(ChatbotModule(reactContext))
        modules.add(OpenSettingsModule(reactContext))
        
        return modules
    }
}

