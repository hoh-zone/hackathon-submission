import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Drawer,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  Fab,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ListIcon from '@mui/icons-material/List';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import LogManager from '../../utils/LogManager';

interface LogPanelProps {
  position?: 'left' | 'right' | 'top' | 'bottom';
}

const LogPanel: React.FC<LogPanelProps> = ({ position = 'right' }) => {
  const [open, setOpen] = useState(false);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleClearLogs = () => {
    LogManager.clearLogs();
    // 强制组件重新渲染
    setOpen(false);
    setTimeout(() => setOpen(true), 100);
  };

  const handleDownloadLogs = () => {
    LogManager.downloadLogs();
  };

  return (
    <>
      {/* 悬浮按钮，在页面右下角 */}
      <Fab
        color="primary"
        size="small"
        aria-label="日志"
        onClick={toggleDrawer}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
        }}
      >
        <ListIcon />
      </Fab>

      {/* 日志抽屉 */}
      <Drawer
        anchor={position}
        open={open}
        onClose={toggleDrawer}
        sx={{
          '& .MuiDrawer-paper': {
            width: position === 'left' || position === 'right' ? '400px' : '100%',
            height: position === 'top' || position === 'bottom' ? '300px' : '100%',
          },
        }}
      >
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          flexDirection: 'column',
          height: '100%',
          position: 'relative'
        }}>
          {/* 顶部标题 */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            mb: 2,
            position: 'sticky',
            top: 0,
            backgroundColor: 'background.paper',
            zIndex: 2
          }}>
            <Typography variant="h6">操作日志</Typography>
          </Box>
          <Divider />
          
          {/* 日志内容区 - 调整maxHeight为calc(100vh - 150px)给底部按钮腾出空间 */}
          <List sx={{ 
            flexGrow: 1,
            maxHeight: 'calc(100vh - 150px)', 
            overflowY: 'auto',
            mb: 8 // 底部留白，避免最后一条日志被按钮遮挡
          }}>
            {LogManager.logs.length === 0 ? (
              <ListItem>
                <ListItemText primary="暂无日志记录" />
              </ListItem>
            ) : (
              LogManager.logs.map((log, index) => (
                <ListItem key={index} divider sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(log.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                  <Typography variant="body2">{log.message}</Typography>
                  {log.data && (
                    <Box 
                      sx={{ 
                        mt: 0.5, 
                        p: 1, 
                        backgroundColor: 'rgba(0,0,0,0.03)', 
                        borderRadius: 1,
                        width: '100%',
                        overflow: 'auto'
                      }}
                    >
                      <Typography variant="caption" component="pre" sx={{ m: 0 }}>
                        {JSON.stringify(log.data, null, 2)}
                      </Typography>
                    </Box>
                  )}
                </ListItem>
              ))
            )}
          </List>
          
          {/* 底部操作按钮 */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 2,
            backgroundColor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
            zIndex: 3
          }}>
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={handleClearLogs}
            >
              清空日志
            </Button>
            <Box>
              <Tooltip title="导出日志">
                <IconButton size="small" onClick={handleDownloadLogs} sx={{ ml: 1 }}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="关闭">
                <IconButton size="small" onClick={toggleDrawer} sx={{ ml: 1 }}>
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default LogPanel; 