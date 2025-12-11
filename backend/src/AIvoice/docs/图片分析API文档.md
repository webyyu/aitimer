# 图片分析API文档

## 概述

图片分析API提供了基于阿里云通义千问大模型的图片理解能力。支持图片上传到OSS后进行分析，也可以直接分析网络图片URL。

## 功能特性

- 🖼️ 支持多种图片格式：JPEG、PNG、GIF、WebP、BMP
- ☁️ 自动上传到阿里云OSS存储
- 🤖 基于通义千问VL模型进行智能分析
- 🔄 支持自定义分析提示词
- 🛡️ 内容安全检查
- 📊 返回详细的Token使用统计

## API端点

### 1. 上传图片并分析

**POST** `/api/image-analysis/upload-analyze`

上传本地图片文件，自动存储到OSS，然后调用通义千问进行分析。

#### 请求参数

- **Content-Type**: `multipart/form-data`
- **Authorization**: `Bearer {token}` (必需)

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| image | File | 是 | 图片文件，支持jpg、png、gif、webp、bmp格式 |
| prompt | String | 否 | 分析提示词，默认为"请分析这张图片的内容" |

#### 请求示例

```bash
curl -X POST http://localhost:3000/api/image-analysis/upload-analyze \
  -H "Authorization: Bearer your-token-here" \
  -F "image=@/path/to/your/image.jpg" \
  -F "prompt=请详细描述这张图片中的内容"
```

#### 响应示例

```json
{
  "success": true,
  "imageUrl": "https://your-bucket.oss-cn-hangzhou.aliyuncs.com/images/123/1234567890_image.jpg",
  "ossKey": "images/123/1234567890_image.jpg",
  "analysis": {
    "content": "这张图片展示了一个美丽的自然风景...",
    "finishReason": "stop",
    "usage": {
      "input_tokens": 45,
      "output_tokens": 128,
      "total_tokens": 173
    }
  }
}
```

### 2. 根据URL分析图片

**POST** `/api/image-analysis/analyze-url`

直接分析网络图片URL，无需上传文件。

#### 请求参数

- **Content-Type**: `application/json`
- **Authorization**: `Bearer {token}` (必需)

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| imageUrl | String | 是 | 图片的网络URL地址 |
| prompt | String | 是 | 分析提示词 |

#### 请求示例

```bash
curl -X POST http://localhost:3000/api/image-analysis/analyze-url \
  -H "Authorization: Bearer your-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/image.jpg",
    "prompt": "这张图片中有什么？请用中文描述"
  }'
```

#### 响应示例

```json
{
  "success": true,
  "imageUrl": "https://example.com/image.jpg",
  "analysis": {
    "content": "图片中有一只可爱的小狗...",
    "finishReason": "stop",
    "usage": {
      "input_tokens": 23,
      "output_tokens": 89,
      "total_tokens": 112
    }
  }
}
```

## 环境配置

### 必需的环境变量

在`.env`文件中配置以下变量：

```bash
# 阿里云通义千问API密钥
DASHSCOPE_API_KEY=your-dashscope-api-key

# 阿里云OSS配置
OSS_ACCESS_KEY_ID=your-oss-access-key-id
OSS_ACCESS_KEY_SECRET=your-oss-access-key-secret
OSS_BUCKET=your-oss-bucket-name
OSS_REGION=oss-cn-hangzhou
```

### 获取API密钥

1. 登录[阿里云DashScope控制台](https://dashscope.console.aliyun.com/)
2. 创建API Key
3. 开通通义千问服务

## 使用限制

- **文件大小**: 最大10MB
- **支持格式**: JPEG、PNG、GIF、WebP、BMP
- **API调用**: 受通义千问API配额限制
- **存储**: 图片永久存储在OSS中

## 错误处理

### 常见错误码

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | 缺少图片文件 | 请求中未包含图片文件 |
| 400 | 不支持的文件类型 | 上传的文件不是支持的图片格式 |
| 400 | 文件大小超过限制 | 图片文件超过10MB限制 |
| 401 | 未认证，缺少用户信息 | 缺少或无效的认证token |
| 500 | 图片分析失败 | 通义千问API调用失败或OSS上传失败 |

### 错误响应示例

```json
{
  "error": "图片分析失败",
  "detail": "通义千问API错误: 模型调用失败"
}
```

## 最佳实践

### 1. 提示词优化

- **具体明确**: "请分析这张图片中的人物表情和情绪状态"
- **结构化输出**: "请按照以下格式分析：1.主要对象 2.场景描述 3.颜色特点"
- **多语言支持**: 可以在提示词中指定输出语言

### 2. 错误处理

```javascript
try {
  const response = await fetch('/api/image-analysis/upload-analyze', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('分析失败:', error.error, error.detail);
    return;
  }
  
  const result = await response.json();
  console.log('分析结果:', result.analysis.content);
  
} catch (error) {
  console.error('请求失败:', error);
}
```

### 3. 批量处理

对于多张图片，建议：
- 串行处理，避免API限流
- 添加适当的延迟
- 实现重试机制

## 测试

### 运行测试

```bash
# 设置测试token
export TEST_TOKEN="your-test-token"

# 运行测试
node src/AIvoice/tests/image-analysis-test.js
```

### 测试要求

- 确保服务器正在运行
- 配置正确的环境变量
- 准备测试图片文件

## 更新日志

- **v1.0.0**: 初始版本，支持图片上传分析和URL分析
- 支持多种图片格式
- 集成通义千问VL模型
- 自动OSS存储
- 内容安全检查

## 技术支持

如有问题，请检查：
1. 环境变量配置是否正确
2. 网络连接是否正常
3. API密钥是否有效
4. OSS配置是否正确



