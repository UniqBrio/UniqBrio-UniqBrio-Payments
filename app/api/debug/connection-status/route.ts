import { NextResponse } from "next/server";
import { connectDB, getConnectionStatus } from "@/lib/db";

export async function GET() {
  try {
    // Get current connection status
    const status = getConnectionStatus();
    
    // Try to connect if not connected
    if (status.readyState !== 1) {
      await connectDB();
    }
    
    // Get updated status after connection attempt
    const updatedStatus = getConnectionStatus();
    
    return NextResponse.json({
      success: true,
      connection: {
        status: updatedStatus.status,
        readyState: updatedStatus.readyState,
        readyStateText: getReadyStateText(updatedStatus.readyState),
        host: updatedStatus.host,
        database: updatedStatus.name,
        poolSize: updatedStatus.poolSize,
        timestamp: new Date().toISOString()
      },
      advice: {
        isOptimal: updatedStatus.readyState === 1,
        recommendations: getRecommendations(updatedStatus)
      }
    });
  } catch (error) {
    console.error("Connection status check failed:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'Error';
    
    return NextResponse.json({
      success: false,
      error: {
        message: errorMessage,
        name: errorName,
        type: "CONNECTION_ERROR"
      },
      connection: getConnectionStatus(),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function getReadyStateText(readyState: number): string {
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[readyState] || 'unknown';
}

function getRecommendations(status: any): string[] {
  const recommendations = [];
  
  if (status.readyState !== 1) {
    recommendations.push("Connection is not established - check network and URI");
  }
  
  if (status.poolSize === 'N/A') {
    recommendations.push("Pool size information unavailable - ensure connection is established");
  }
  
  if (status.status === 'error') {
    recommendations.push("Connection errors detected - check logs for SSL/TLS issues");
  }
  
  if (recommendations.length === 0) {
    recommendations.push("Connection is healthy and optimized");
  }
  
  return recommendations;
}