tuer.me
=======

配置说明：
  
  git clone https://github.com/xiaojue/tuer.me.git

  sudo npm install -d把依赖模块全部安装好，或者用root用户，因为有些是需要比较高的权限的

  确认本机有安装redis-server,mongodb,nginx,nginx concat这几个东西并且已经启动.

  nginx的配置如下,并把hosts修改,把tuer.me这几个域名指向本地127.0.0.1

``` html
    server {
        listen       80;
        server_name  img.tuer.me css.tuer.me js.tuer.me assest.tuer.me;
    
        charset utf-8;
    
        location / {
            concat on;
            concat_unique on;
            concat_max_files 50;
            root   /home/fuqiang/dev/tuer.me/public;
        }
    
        location ~ .*\.(gif|jpg|jpeg|png|bmp|swf)$ {
            root   /home/fuqiang/dev/tuer.me/public;
            valid_referers none blocked tuer.me *.tuer.me;
            expires 30d;
            if ($invalid_referer) {
                  return 403;
            }
        }
    
        location ~ /images/(.*)/(.*)$ {
            default_type image/png;
            alias /home/fuqiang/dev/tuer.me/public/images/$1/$2;
        }
    }

    server {
        listen 80;
        server_name tuer.me www.tuer.me;
    
        charset utf-8;
        
        location / { 
            if ( $http_user_agent ~* "(MSIE)|(MIDP)|(WAP)|(UP.Browser)|(Smartphone)|(Obigo)|(Mobile)|(AU.Browser)|(wxd.Mms)|(WxdB.Browser)|(CLDC)|(UP.Link)|(KM.Browser)|(UCWEB)|(SEMC\-Browser)|(Mini)|(Symbian)|(Palm)|(Nokia)|(Panasonic)|(MOT\-)|(SonyEricsson)|(NEC\-)|(Alcatel)|(Ericsson)|(BENQ)|(BenQ)|(Amoisonic)|(Amoi\-)|(Capitel)|(PHILIPS)|(SAMSUNG)|(Lenovo)|(Mitsu)|(Motorola)|(SHARP)|(WAPPER)|(LG\-)|(LG/)|(EG900)|(CECT)|(Compal)|(kejian)|(Bird)|(BIRD)|(G900/V1.0)|(Arima)|(CTL)|(TDG)|(Daxian)|(DAXIAN)|(DBTEL)|(Eastcom)|(EASTCOM)|(PANTECH)|(Dopod)|(Haier)|(HAIER)|(KONKA)|(KEJIAN)|(LENOVO)|(Soutec)|(SOUTEC)|(SAGEM)|(SEC\-)|(SED\-)|(EMOL\-)|(INNO55)|(ZTE)|(Windows CE)|(Wget)|(Java)|(curl)|(Opera)" ) {
                 rewrite . http://m.tuer.me/ 
                 break; 
            }
            proxy_set_header Host $host:80;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_pass http://localhost:3000;
        }

        location ~ /avatar/(.*)$ {
            proxy_set_header Host $host:80;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_pass http://localhost:3000/user/avatar/$1;
        }
        location ~ /art/(.*)$ {
            proxy_set_header Host $host:80;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_pass http://localhost:3000/user/art/$1;
        }
    }

    server {
        listen 80;
        server_name m.tuer.me;
    
        charset utf-8;
        location / {
            proxy_set_header Host $host:80;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_pass http://localhost:3030;
        }
    }
```
  
  ./nginx -s reload 重新加载配置文件，无报错则成功。
  
  配置mongodb，打开model目录，./mongo 127.0.0.1:10001/node-mongo-tuer init.js执行命令进行数据库初始化
  
  请确保mongo在10001端口可访问，也可以根据配置自行修改model/base.js最后一行的ip和端口号

  然后node app.js 看到服务正常启动，访问tuer.me就可以进行调试开发了。

  数据库开始为空，注册需要依赖本地的sendMail，如果本机不安装sendMail，则注册，找回密码，删回复等功能会报错

  可以自行注释相关代码，并在数据库中手动增加用户即可。

  默认会有一个测试账户，在init.js中被添加 用户名admintest@tuer.me 密码1234qwer
