/********************************************************************************
** Form generated from reading UI file 'notification.ui'
**
** Created by: Qt User Interface Compiler version 5.15.16
**
** WARNING! All changes made in this file will be lost when recompiling UI file!
********************************************************************************/

#ifndef UI_NOTIFICATION_H
#define UI_NOTIFICATION_H

#include <QtCore/QVariant>
#include <QtWidgets/QApplication>
#include <QtWidgets/QDialog>
#include <QtWidgets/QHBoxLayout>
#include <QtWidgets/QLabel>

QT_BEGIN_NAMESPACE

class Ui_Notification
{
public:
    QHBoxLayout *horizontalLayout;
    QLabel *notification;

    void setupUi(QDialog *Notification)
    {
        if (Notification->objectName().isEmpty())
            Notification->setObjectName(QString::fromUtf8("Notification"));
        Notification->setWindowModality(Qt::NonModal);
        Notification->resize(318, 50);
        QSizePolicy sizePolicy(QSizePolicy::MinimumExpanding, QSizePolicy::Minimum);
        sizePolicy.setHorizontalStretch(0);
        sizePolicy.setVerticalStretch(0);
        sizePolicy.setHeightForWidth(Notification->sizePolicy().hasHeightForWidth());
        Notification->setSizePolicy(sizePolicy);
        Notification->setMinimumSize(QSize(0, 0));
        Notification->setWindowTitle(QString::fromUtf8(""));
        Notification->setStyleSheet(QString::fromUtf8("background-color: none;"));
        horizontalLayout = new QHBoxLayout(Notification);
        horizontalLayout->setObjectName(QString::fromUtf8("horizontalLayout"));
        notification = new QLabel(Notification);
        notification->setObjectName(QString::fromUtf8("notification"));
        QSizePolicy sizePolicy1(QSizePolicy::Preferred, QSizePolicy::Preferred);
        sizePolicy1.setHorizontalStretch(0);
        sizePolicy1.setVerticalStretch(0);
        sizePolicy1.setHeightForWidth(notification->sizePolicy().hasHeightForWidth());
        notification->setSizePolicy(sizePolicy1);
        notification->setMinimumSize(QSize(300, 0));
        notification->setMaximumSize(QSize(16777215, 16777215));
        notification->setStyleSheet(QString::fromUtf8("border: none;\n"
"border-radius: 10px;\n"
"color: #282d31;\n"
"background-color: #ffcb00;\n"
""));
        notification->setText(QString::fromUtf8(""));
        notification->setAlignment(Qt::AlignCenter);
        notification->setWordWrap(true);

        horizontalLayout->addWidget(notification);


        retranslateUi(Notification);

        QMetaObject::connectSlotsByName(Notification);
    } // setupUi

    void retranslateUi(QDialog *Notification)
    {
        (void)Notification;
    } // retranslateUi

};

namespace Ui {
    class Notification: public Ui_Notification {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_NOTIFICATION_H
